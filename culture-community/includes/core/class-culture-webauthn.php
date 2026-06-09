<?php
/**
 * Lightweight WebAuthn handler — no external dependencies.
 * Supports ES256 (P-256 ECDSA) and RS256 (PKCS1-SHA256).
 * Uses PHP's built-in OpenSSL extension and WP transients for challenges.
 */
class Culture_WebAuthn {

    const RP_NAME               = 'The Moveee';
    const CHALLENGE_TTL         = 300;   // 5 minutes
    const STEP_UP_TTL           = 300;   // step-up token lifetime
    const MAX_PASSKEYS_PER_USER = 5;
    const MAX_ACCOUNTS_PER_AAGUID = 2;

    /* ——————————————————————————————————————
     *  RP helpers
     * —————————————————————————————————————— */

    public static function rp_id() : string {
        // 1. Explicit constant in wp-config.php (highest priority)
        if ( defined( 'CULTURE_WEBAUTHN_RP_ID' ) ) {
            return CULTURE_WEBAUTHN_RP_ID;
        }
        // 2. WordPress option settable from DB/admin
        $option = get_option( 'culture_webauthn_rp_id' );
        if ( $option ) return (string) $option;
        // 3. Auto-derive: strip www. and common headless CMS subdomains
        //    so cms.themoveee.com → themoveee.com automatically
        $host = wp_parse_url( home_url(), PHP_URL_HOST );
        $host = preg_replace( '/^www\./', '', $host );
        return preg_replace( '/^(cms|wp|admin|api|backend)\./', '', $host );
    }

    /* ——————————————————————————————————————
     *  Base64url
     * —————————————————————————————————————— */

    public static function b64url_encode( string $data ) : string {
        return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
    }

    public static function b64url_decode( string $data ) : string {
        $pad = strlen( $data ) % 4;
        if ( $pad ) $data .= str_repeat( '=', 4 - $pad );
        return base64_decode( strtr( $data, '-_', '+/' ) );
    }

    /* ——————————————————————————————————————
     *  Challenge management
     * —————————————————————————————————————— */

    private static function store_challenge( string $key, string $bytes ) : void {
        set_transient( 'culture_wn_' . $key, self::b64url_encode( $bytes ), self::CHALLENGE_TTL );
    }

    private static function consume_challenge( string $key ) : ?string {
        $stored = get_transient( 'culture_wn_' . $key );
        if ( $stored === false ) return null;
        delete_transient( 'culture_wn_' . $key );
        return self::b64url_decode( $stored );
    }

    /* ——————————————————————————————————————
     *  Minimal CBOR decoder
     *  Handles maps, arrays, byte strings, text, ints.
     * —————————————————————————————————————— */

    public static function cbor_decode( string $data, int &$offset = 0 ) {
        if ( $offset >= strlen( $data ) ) {
            throw new RuntimeException( 'CBOR: unexpected end of data' );
        }
        $initial = ord( $data[ $offset++ ] );
        $major   = $initial >> 5;
        $info    = $initial & 0x1f;
        $len     = self::cbor_length( $data, $offset, $info );

        switch ( $major ) {
            case 0: return $len;
            case 1: return -1 - $len;
            case 2:
                $s = substr( $data, $offset, $len );
                $offset += $len;
                return $s;
            case 3:
                $s = substr( $data, $offset, $len );
                $offset += $len;
                return $s;
            case 4:
                $arr = [];
                for ( $i = 0; $i < $len; $i++ ) {
                    $arr[] = self::cbor_decode( $data, $offset );
                }
                return $arr;
            case 5:
                $map = [];
                for ( $i = 0; $i < $len; $i++ ) {
                    $k       = self::cbor_decode( $data, $offset );
                    $map[$k] = self::cbor_decode( $data, $offset );
                }
                return $map;
            case 7:
                if ( $info === 20 ) return false;
                if ( $info === 21 ) return true;
                if ( $info === 22 ) return null;
                return null;
            default:
                throw new RuntimeException( "CBOR: unsupported major type {$major}" );
        }
    }

    private static function cbor_length( string $data, int &$offset, int $info ) : int {
        if ( $info <= 23 ) return $info;
        if ( $info === 24 ) { $v = ord( $data[ $offset++ ] ); return $v; }
        if ( $info === 25 ) { $v = unpack( 'n', substr( $data, $offset, 2 ) )[1]; $offset += 2; return $v; }
        if ( $info === 26 ) { $v = unpack( 'N', substr( $data, $offset, 4 ) )[1]; $offset += 4; return $v; }
        if ( $info === 27 ) { $v = unpack( 'J', substr( $data, $offset, 8 ) )[1]; $offset += 8; return (int) $v; }
        throw new RuntimeException( "CBOR: unsupported additional info {$info}" );
    }

    /* ——————————————————————————————————————
     *  AuthenticatorData parser
     * —————————————————————————————————————— */

    private static function parse_auth_data( string $raw ) : array {
        if ( strlen( $raw ) < 37 ) throw new RuntimeException( 'authData too short' );
        $rp_hash = substr( $raw, 0, 32 );
        $flags   = ord( $raw[32] );
        $counter = unpack( 'N', substr( $raw, 33, 4 ) )[1];

        $result = [
            'rp_id_hash' => $rp_hash,
            'up'         => (bool) ( $flags & 0x01 ),
            'uv'         => (bool) ( $flags & 0x04 ),
            'at'         => (bool) ( $flags & 0x40 ),
            'counter'    => $counter,
            'aaguid'     => null,
            'cred_id'    => null,
            'cred_pk'    => null,
        ];

        if ( $result['at'] && strlen( $raw ) > 37 ) {
            $pos            = 37;
            $aaguid_bytes   = substr( $raw, $pos, 16 ); $pos += 16;
            $result['aaguid'] = self::format_aaguid( $aaguid_bytes );

            $id_len         = unpack( 'n', substr( $raw, $pos, 2 ) )[1]; $pos += 2;
            $result['cred_id'] = substr( $raw, $pos, $id_len ); $pos += $id_len;

            $cose_raw = substr( $raw, $pos );
            $ofs      = 0;
            $result['cred_pk'] = self::cbor_decode( $cose_raw, $ofs );
        }

        return $result;
    }

    private static function format_aaguid( string $bytes ) : string {
        $h = bin2hex( $bytes );
        return sprintf( '%s-%s-%s-%s-%s',
            substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12)
        );
    }

    /* ——————————————————————————————————————
     *  COSE key → PEM SubjectPublicKeyInfo
     * —————————————————————————————————————— */

    private static function cose_to_pem( array $cose ) : ?string {
        $kty = $cose[1] ?? null;

        if ( $kty == 2 ) {
            // EC key (ES256, crv=P-256)
            $x = $cose[-2] ?? null;
            $y = $cose[-3] ?? null;
            if ( ! $x || ! $y || strlen($x) !== 32 || strlen($y) !== 32 ) return null;
            $point   = "\x04" . $x . $y;
            $alg_seq = "\x30\x13"
                      . "\x06\x07" . "\x2a\x86\x48\xce\x3d\x02\x01"
                      . "\x06\x08" . "\x2a\x86\x48\xce\x3d\x03\x01\x07";
            $bit_str = "\x03" . self::der_len_byte( 1 + strlen($point) ) . "\x00" . $point;
            $spki    = "\x30" . self::der_len_byte( strlen($alg_seq) + strlen($bit_str) )
                      . $alg_seq . $bit_str;
            return "-----BEGIN PUBLIC KEY-----\n"
                  . chunk_split( base64_encode( $spki ), 64 )
                  . "-----END PUBLIC KEY-----\n";
        }

        if ( $kty == 3 ) {
            // RSA key (RS256)
            $n = $cose[-1] ?? null;
            $e = $cose[-2] ?? null;
            if ( ! $n || ! $e ) return null;
            return self::rsa_to_pem( $n, $e );
        }

        return null;
    }

    private static function der_len_byte( int $len ) : string {
        if ( $len <= 0x7f ) return chr( $len );
        if ( $len <= 0xff ) return "\x81" . chr( $len );
        return "\x82" . pack( 'n', $len );
    }

    private static function der_encode_int( string $val ) : string {
        $val = ltrim( $val, "\x00" ) ?: "\x00";
        if ( ord($val[0]) & 0x80 ) $val = "\x00" . $val;
        return "\x02" . self::der_len_byte( strlen($val) ) . $val;
    }

    private static function rsa_to_pem( string $n, string $e ) : string {
        $n_int   = self::der_encode_int( $n );
        $e_int   = self::der_encode_int( $e );
        $rsa_key = "\x30" . self::der_len_byte( strlen($n_int) + strlen($e_int) ) . $n_int . $e_int;
        $alg_seq = "\x30\x0d"
                  . "\x06\x09" . "\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01"
                  . "\x05\x00";
        $bit_str = "\x03" . self::der_len_byte( 1 + strlen($rsa_key) ) . "\x00" . $rsa_key;
        $spki    = "\x30" . self::der_len_byte( strlen($alg_seq) + strlen($bit_str) )
                  . $alg_seq . $bit_str;
        return "-----BEGIN PUBLIC KEY-----\n"
              . chunk_split( base64_encode( $spki ), 64 )
              . "-----END PUBLIC KEY-----\n";
    }

    /* ——————————————————————————————————————
     *  Signature verification
     * —————————————————————————————————————— */

    private static function verify_sig( int $alg, string $pem, string $sig, string $data ) : bool {
        if ( $alg === -7 ) {
            // ES256: convert raw (r||s) to DER if needed
            if ( strlen($sig) === 64 ) {
                $r = $sig[0] === "\x00" ? substr($sig,1,32) : substr($sig,0,32);
                $s = substr($sig,32,32);
                $r = ltrim($r, "\x00"); if ( ord($r[0]) & 0x80 ) $r = "\x00".$r;
                $s = ltrim($s, "\x00"); if ( ord($s[0]) & 0x80 ) $s = "\x00".$s;
                $ri  = "\x02" . chr(strlen($r)) . $r;
                $si  = "\x02" . chr(strlen($s)) . $s;
                $sig = "\x30" . chr(strlen($ri)+strlen($si)) . $ri . $si;
            }
            return openssl_verify( $data, $sig, $pem, OPENSSL_ALGO_SHA256 ) === 1;
        }
        if ( $alg === -257 ) {
            return openssl_verify( $data, $sig, $pem, OPENSSL_ALGO_SHA256 ) === 1;
        }
        return false;
    }

    /* ——————————————————————————————————————
     *  DB helpers
     * —————————————————————————————————————— */

    private static function table() : string {
        return $GLOBALS['wpdb']->prefix . 'culture_passkeys';
    }

    public static function get_credentials( int $user_id ) : array {
        global $wpdb;
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}culture_passkeys WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ), ARRAY_A ) ?: [];
    }

    private static function find_credential( string $cred_id_b64 ) : ?array {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}culture_passkeys WHERE credential_id = %s",
            $cred_id_b64
        ), ARRAY_A );
        return $row ?: null;
    }

    /* ——————————————————————————————————————
     *  Registration
     * —————————————————————————————————————— */

    public static function get_register_options( int $user_id ) : array {
        $user      = get_userdata( $user_id );
        $challenge = random_bytes( 32 );
        self::store_challenge( 'reg_' . $user_id, $challenge );

        $existing = self::get_credentials( $user_id );
        $exclude  = array_map( fn($c) => [
            'type' => 'public-key',
            'id'   => $c['credential_id'],
        ], $existing );

        return [
            'rp'                     => [ 'id' => self::rp_id(), 'name' => self::RP_NAME ],
            'user'                   => [
                'id'          => self::b64url_encode( str_pad( (string) $user_id, 8, "\x00", STR_PAD_LEFT ) ),
                'name'        => $user->user_login,
                'displayName' => $user->display_name ?: $user->user_login,
            ],
            'challenge'              => self::b64url_encode( $challenge ),
            'pubKeyCredParams'       => [
                [ 'type' => 'public-key', 'alg' => -7   ],
                [ 'type' => 'public-key', 'alg' => -257 ],
            ],
            'timeout'                => 60000,
            'excludeCredentials'     => $exclude,
            'authenticatorSelection' => [
                'residentKey'        => 'preferred',
                'userVerification'   => 'preferred',
            ],
            'attestation'            => 'none',
        ];
    }

    public static function verify_register( int $user_id, array $resp ) : array {
        try {
            $client_json  = self::b64url_decode( $resp['clientDataJSON'] ?? '' );
            $client_data  = json_decode( $client_json, true );

            if ( ( $client_data['type'] ?? '' ) !== 'webauthn.create' ) {
                return [ 'success' => false, 'error' => 'Invalid type.' ];
            }

            $challenge = self::consume_challenge( 'reg_' . $user_id );
            if ( ! $challenge ) return [ 'success' => false, 'error' => 'Challenge expired. Please try again.' ];

            if ( ! hash_equals( $challenge, self::b64url_decode( $client_data['challenge'] ) ) ) {
                return [ 'success' => false, 'error' => 'Challenge mismatch.' ];
            }

            $att_obj   = self::cbor_decode( self::b64url_decode( $resp['attestationObject'] ?? '' ) );
            $auth_data = self::parse_auth_data( $att_obj['authData'] );

            if ( ! hash_equals( hash( 'sha256', self::rp_id(), true ), $auth_data['rp_id_hash'] ) ) {
                return [ 'success' => false, 'error' => 'RP ID mismatch.' ];
            }
            if ( ! $auth_data['up'] ) return [ 'success' => false, 'error' => 'User presence required.' ];
            if ( ! $auth_data['cred_pk'] ) return [ 'success' => false, 'error' => 'No credential public key.' ];

            $cred_id_b64 = self::b64url_encode( $auth_data['cred_id'] );
            $cose        = $auth_data['cred_pk'];
            $alg         = (int) ( $cose[3] ?? -7 );
            $pem         = self::cose_to_pem( $cose );
            if ( ! $pem ) return [ 'success' => false, 'error' => 'Unsupported key algorithm.' ];

            // Soft device-count limit
            $aaguid = $auth_data['aaguid'];
            if ( $aaguid && $aaguid !== '00000000-0000-0000-0000-000000000000' ) {
                global $wpdb;
                $others = (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->prefix}culture_passkeys WHERE aaguid = %s AND user_id != %d",
                    $aaguid, $user_id
                ) );
                if ( $others >= self::MAX_ACCOUNTS_PER_AAGUID ) {
                    return [ 'success' => false, 'error' => 'This device already has the maximum number of Moveee accounts.' ];
                }
            }

            global $wpdb;
            $device_name = sanitize_text_field( $resp['device_name'] ?? 'My Device' );
            $wpdb->insert(
                $wpdb->prefix . 'culture_passkeys',
                [
                    'user_id'       => $user_id,
                    'credential_id' => $cred_id_b64,
                    'public_key'    => base64_encode( $pem ),
                    'alg'           => $alg,
                    'sign_count'    => $auth_data['counter'],
                    'device_name'   => $device_name,
                    'aaguid'        => $aaguid ?? '',
                    'transports'    => wp_json_encode( $resp['transports'] ?? [] ),
                    'created_at'    => current_time( 'mysql' ),
                    'last_used_at'  => current_time( 'mysql' ),
                ],
                [ '%d', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s' ]
            );

            $count = count( self::get_credentials( $user_id ) );
            update_user_meta( $user_id, '_culture_has_passkey', 1 );
            update_user_meta( $user_id, '_culture_passkey_count', $count );
            self::release_escrow( $user_id );

            return [ 'success' => true, 'credential_id' => $cred_id_b64 ];
        } catch ( Exception $e ) {
            return [ 'success' => false, 'error' => 'Verification error: ' . $e->getMessage() ];
        }
    }

    /* ——————————————————————————————————————
     *  Authentication (login)
     * —————————————————————————————————————— */

    public static function get_login_options( ?int $user_id = null ) : array {
        $challenge = random_bytes( 32 );
        $ck        = $user_id ? 'login_' . $user_id : 'login_anon_' . wp_generate_password( 8, false );
        self::store_challenge( $ck, $challenge );

        $allow = [];
        if ( $user_id ) {
            foreach ( self::get_credentials( $user_id ) as $c ) {
                $t   = json_decode( $c['transports'] ?? '[]', true ) ?: [];
                $row = [ 'type' => 'public-key', 'id' => $c['credential_id'] ];
                if ( $t ) $row['transports'] = $t;
                $allow[] = $row;
            }
        }

        return [
            'challenge'        => self::b64url_encode( $challenge ),
            'timeout'          => 60000,
            'rpId'             => self::rp_id(),
            'allowCredentials' => $allow,
            'userVerification' => 'preferred',
            '_challenge_key'   => $ck,
        ];
    }

    public static function verify_login( array $resp ) : array {
        return self::verify_assertion( $resp, null, 'login' );
    }

    /* ——————————————————————————————————————
     *  Step-up authentication
     * —————————————————————————————————————— */

    public static function get_step_up_options( int $user_id ) : array {
        $challenge = random_bytes( 32 );
        self::store_challenge( 'stepup_' . $user_id, $challenge );

        $allow = array_map( fn($c) => [
            'type' => 'public-key',
            'id'   => $c['credential_id'],
        ], self::get_credentials( $user_id ) );

        return [
            'challenge'        => self::b64url_encode( $challenge ),
            'timeout'          => 60000,
            'rpId'             => self::rp_id(),
            'allowCredentials' => $allow,
            'userVerification' => 'required',
        ];
    }

    public static function verify_step_up( int $user_id, array $resp ) : array {
        $result = self::verify_assertion( $resp, $user_id, 'stepup' );
        if ( ! $result['success'] ) return $result;
        $token = wp_generate_password( 48, false );
        set_transient( 'culture_su_' . $user_id . '_' . $token, 1, self::STEP_UP_TTL );
        return [ 'success' => true, 'step_up_token' => $token ];
    }

    public static function validate_step_up( int $user_id, string $token ) : bool {
        $key = 'culture_su_' . $user_id . '_' . $token;
        if ( get_transient( $key ) ) {
            delete_transient( $key );
            return true;
        }
        return false;
    }

    /* ——————————————————————————————————————
     *  Shared assertion verifier
     * —————————————————————————————————————— */

    private static function verify_assertion( array $resp, ?int $expected_user_id, string $challenge_prefix ) : array {
        try {
            $cred_id_b64 = $resp['id'] ?? '';
            $row         = self::find_credential( $cred_id_b64 );
            if ( ! $row ) return [ 'success' => false, 'error' => 'Unknown credential.' ];

            $user_id = (int) $row['user_id'];
            if ( $expected_user_id && $user_id !== $expected_user_id ) {
                return [ 'success' => false, 'error' => 'Credential does not belong to this user.' ];
            }

            $ck        = $challenge_prefix . '_' . $user_id;
            $challenge = self::consume_challenge( $ck );
            // Fallback: anon login challenge passed via _challenge_key
            if ( ! $challenge && isset( $resp['_challenge_key'] ) ) {
                $challenge = self::consume_challenge( $resp['_challenge_key'] );
            }
            if ( ! $challenge ) return [ 'success' => false, 'error' => 'Challenge expired. Please try again.' ];

            $client_json = self::b64url_decode( $resp['clientDataJSON'] ?? '' );
            $client_data = json_decode( $client_json, true );

            if ( ( $client_data['type'] ?? '' ) !== 'webauthn.get' ) {
                return [ 'success' => false, 'error' => 'Invalid type.' ];
            }
            if ( ! hash_equals( $challenge, self::b64url_decode( $client_data['challenge'] ) ) ) {
                return [ 'success' => false, 'error' => 'Challenge mismatch.' ];
            }

            $auth_data_raw = self::b64url_decode( $resp['authenticatorData'] ?? '' );
            $auth_data     = self::parse_auth_data( $auth_data_raw );

            if ( ! hash_equals( hash( 'sha256', self::rp_id(), true ), $auth_data['rp_id_hash'] ) ) {
                return [ 'success' => false, 'error' => 'RP ID mismatch.' ];
            }
            if ( ! $auth_data['up'] ) return [ 'success' => false, 'error' => 'User presence required.' ];

            $client_hash = hash( 'sha256', $client_json, true );
            $signed_data = $auth_data_raw . $client_hash;
            $sig         = self::b64url_decode( $resp['signature'] ?? '' );
            $pem         = base64_decode( $row['public_key'] );
            $alg         = (int) ( $row['alg'] ?? -7 );

            if ( ! self::verify_sig( $alg, $pem, $sig, $signed_data ) ) {
                return [ 'success' => false, 'error' => 'Signature invalid.' ];
            }

            $new_count = (int) $auth_data['counter'];
            if ( (int) $row['sign_count'] > 0 && $new_count > 0 && $new_count <= (int) $row['sign_count'] ) {
                return [ 'success' => false, 'error' => 'Replay detected.' ];
            }

            global $wpdb;
            $wpdb->update(
                $wpdb->prefix . 'culture_passkeys',
                [ 'sign_count' => $new_count, 'last_used_at' => current_time('mysql') ],
                [ 'id' => (int) $row['id'] ],
                [ '%d', '%s' ], [ '%d' ]
            );

            if ( $challenge_prefix === 'login' ) {
                $token = wp_generate_password( 48, false );
                set_transient( 'culture_pk_login_' . $token, $user_id, 120 );
                return [ 'success' => true, 'passkey_token' => $token, 'user_id' => $user_id ];
            }

            return [ 'success' => true, 'user_id' => $user_id ];
        } catch ( Exception $e ) {
            return [ 'success' => false, 'error' => 'Verification error: ' . $e->getMessage() ];
        }
    }

    /* ——————————————————————————————————————
     *  Passkey token exchange (for NextAuth)
     * —————————————————————————————————————— */

    public static function exchange_passkey_token( string $token ) : ?int {
        $key     = 'culture_pk_login_' . $token;
        $user_id = get_transient( $key );
        if ( ! $user_id ) return null;
        delete_transient( $key );
        return (int) $user_id;
    }

    /* ——————————————————————————————————————
     *  Credential management
     * —————————————————————————————————————— */

    public static function delete_credential( int $user_id, string $cred_id_b64 ) : bool {
        global $wpdb;
        $deleted = (int) $wpdb->delete(
            $wpdb->prefix . 'culture_passkeys',
            [ 'user_id' => $user_id, 'credential_id' => $cred_id_b64 ],
            [ '%d', '%s' ]
        );
        $count = count( self::get_credentials( $user_id ) );
        update_user_meta( $user_id, '_culture_passkey_count', $count );
        update_user_meta( $user_id, '_culture_has_passkey', $count > 0 ? 1 : 0 );
        return $deleted > 0;
    }

    /* ——————————————————————————————————————
     *  Credit escrow
     * —————————————————————————————————————— */

    public static function escrow_credits( int $user_id, int $amount, string $source, int $source_id ) : void {
        $held = (int) get_user_meta( $user_id, '_culture_credits_escrowed', true );
        update_user_meta( $user_id, '_culture_credits_escrowed', $held + $amount );
        Culture_Gamification::ledger_add( $user_id, 'credit', $amount, 'escrow_' . $source, $source_id );
    }

    public static function release_escrow( int $user_id ) : int {
        $held = (int) get_user_meta( $user_id, '_culture_credits_escrowed', true );
        if ( $held <= 0 ) return 0;
        delete_user_meta( $user_id, '_culture_credits_escrowed' );
        $current = (int) get_user_meta( $user_id, '_culture_credits', true );
        update_user_meta( $user_id, '_culture_credits', $current + $held );
        Culture_Gamification::ledger_add( $user_id, 'credit', $held, 'escrow_release', 0 );
        return $held;
    }
}
