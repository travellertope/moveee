<?php
/**
 * PHPUnit bootstrap for Culture Community tests.
 *
 * Loads WordPress test suite if available, otherwise provides
 * a minimal mock environment for unit testing.
 */

// Try to load WordPress test suite.
$wp_tests_dir = getenv( 'WP_TESTS_DIR' ) ?: '/tmp/wordpress-tests-lib';

if ( file_exists( $wp_tests_dir . '/includes/functions.php' ) ) {
    require_once $wp_tests_dir . '/includes/functions.php';

    function _manually_load_plugin() {
        require dirname( __DIR__ ) . '/culture-community.php';
    }
    tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

    require $wp_tests_dir . '/includes/bootstrap.php';
} else {
    // Minimal mock environment for standalone unit tests.
    define( 'ABSPATH', '/tmp/wordpress/' );
    define( 'CULTURE_VERSION', '1.0.0' );
    define( 'CULTURE_PLUGIN_DIR', dirname( __DIR__ ) . '/' );
    define( 'CULTURE_PLUGIN_FILE', dirname( __DIR__ ) . '/culture-community.php' );

    // ── Mock data stores ──
    $GLOBALS['_culture_test_user_meta'] = array();
    $GLOBALS['_culture_test_post_meta'] = array();
    $GLOBALS['_culture_test_posts']     = array();
    $GLOBALS['_culture_test_attendance'] = array();
    $GLOBALS['_culture_test_attendance_id'] = 0;

    // ── User meta stubs ──
    if ( ! function_exists( 'get_user_meta' ) ) {
        function get_user_meta( $user_id, $key = '', $single = false ) {
            $store = $GLOBALS['_culture_test_user_meta'];
            if ( empty( $key ) ) {
                return $store[ $user_id ] ?? array();
            }
            if ( ! isset( $store[ $user_id ][ $key ] ) ) {
                return $single ? '' : array();
            }
            $value = $store[ $user_id ][ $key ];
            if ( $single ) {
                return $value;
            }
            return (array) $value;
        }

        function update_user_meta( $user_id, $key, $value ) {
            $GLOBALS['_culture_test_user_meta'][ $user_id ][ $key ] = $value;
            return true;
        }

        function delete_user_meta( $user_id, $key ) {
            unset( $GLOBALS['_culture_test_user_meta'][ $user_id ][ $key ] );
            return true;
        }
    }

    // ── Post meta stubs ──
    if ( ! function_exists( 'get_post_meta' ) ) {
        function get_post_meta( $post_id, $key = '', $single = false ) {
            $store = $GLOBALS['_culture_test_post_meta'];
            if ( empty( $key ) ) {
                return $store[ $post_id ] ?? array();
            }
            if ( ! isset( $store[ $post_id ][ $key ] ) ) {
                return $single ? '' : array();
            }
            $value = $store[ $post_id ][ $key ];
            return $single ? $value : (array) $value;
        }

        function update_post_meta( $post_id, $key, $value ) {
            $GLOBALS['_culture_test_post_meta'][ $post_id ][ $key ] = $value;
            return true;
        }
    }

    // ── Post stubs ──
    if ( ! function_exists( 'get_post' ) ) {
        function get_post( $post_id ) {
            return $GLOBALS['_culture_test_posts'][ $post_id ] ?? null;
        }
    }

    if ( ! function_exists( 'get_userdata' ) ) {
        function get_userdata( $user_id ) {
            if ( isset( $GLOBALS['_culture_test_user_meta'][ $user_id ] ) ) {
                return (object) array(
                    'ID'           => $user_id,
                    'display_name' => 'Test User ' . $user_id,
                    'user_email'   => 'user' . $user_id . '@test.com',
                );
            }
            return false;
        }
    }

    if ( ! function_exists( 'current_time' ) ) {
        function current_time( $type = 'mysql' ) {
            return ( 'mysql' === $type ) ? gmdate( 'Y-m-d H:i:s' ) : time();
        }
    }

    // ── Core WP stubs ──
    if ( ! function_exists( 'do_action' ) ) {
        function do_action( ...$args ) {}
    }

    if ( ! function_exists( 'absint' ) ) {
        function absint( $val ) { return abs( (int) $val ); }
    }

    if ( ! function_exists( 'wp_hash' ) ) {
        function wp_hash( $data ) { return hash( 'md5', $data . 'test_salt' ); }
    }

    if ( ! function_exists( 'wp_rand' ) ) {
        function wp_rand( $min = 0, $max = PHP_INT_MAX ) { return random_int( $min, $max ); }
    }

    if ( ! function_exists( 'get_users' ) ) {
        function get_users( $args = array() ) {
            if ( isset( $args['meta_key'], $args['meta_value'] ) ) {
                $results = array();
                foreach ( $GLOBALS['_culture_test_user_meta'] as $uid => $meta ) {
                    if ( isset( $meta[ $args['meta_key'] ] ) && $meta[ $args['meta_key'] ] === $args['meta_value'] ) {
                        $results[] = ( isset( $args['fields'] ) && $args['fields'] === 'ID' ) ? $uid : (object) array( 'ID' => $uid );
                    }
                }
                return array_slice( $results, 0, $args['number'] ?? 100 );
            }
            return array();
        }
    }

    if ( ! function_exists( 'add_query_arg' ) ) {
        function add_query_arg( $key, $value = '', $url = '' ) {
            if ( is_array( $key ) ) {
                $url = $value ?: '';
                foreach ( $key as $k => $v ) {
                    $url .= ( strpos( $url, '?' ) === false ? '?' : '&' ) . rawurlencode( $k ) . '=' . rawurlencode( $v );
                }
                return $url;
            }
            return $url . ( strpos( $url, '?' ) === false ? '?' : '&' ) . rawurlencode( $key ) . '=' . rawurlencode( $value );
        }
    }

    if ( ! function_exists( 'home_url' ) ) {
        function home_url( $path = '' ) { return 'http://example.com' . $path; }
    }

    if ( ! function_exists( 'rest_ensure_response' ) ) {
        function rest_ensure_response( $data ) { return $data; }
    }

    if ( ! function_exists( 'get_option' ) ) {
        function get_option( $key, $default = '' ) { return $default; }
    }

    if ( ! function_exists( 'hash_equals' ) ) {
        // Already exists in PHP 5.6+, but just in case.
    }

    if ( ! function_exists( 'sanitize_key' ) ) {
        function sanitize_key( $key ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $key ) ); }
    }

    if ( ! function_exists( 'sanitize_text_field' ) ) {
        function sanitize_text_field( $str ) { return trim( strip_tags( $str ) ); }
    }

    if ( ! function_exists( '__' ) ) {
        function __( $text, $domain = 'default' ) { return $text; }
    }

    if ( ! function_exists( 'esc_html' ) ) {
        function esc_html( $text ) { return htmlspecialchars( $text, ENT_QUOTES, 'UTF-8' ); }
    }

    if ( ! function_exists( 'esc_attr' ) ) {
        function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
    }

    if ( ! function_exists( 'esc_url' ) ) {
        function esc_url( $url ) { return filter_var( $url, FILTER_SANITIZE_URL ) ?: ''; }
    }

    if ( ! function_exists( 'wp_kses_post' ) ) {
        function wp_kses_post( $text ) { return $text; }
    }

    if ( ! function_exists( 'wp_mail' ) ) {
        // Store sent emails for test assertions.
        $GLOBALS['_culture_test_emails'] = array();
        function wp_mail( $to, $subject, $body, $headers = array() ) {
            $GLOBALS['_culture_test_emails'][] = array(
                'to'      => $to,
                'subject' => $subject,
                'body'    => $body,
                'headers' => $headers,
            );
            return true;
        }
    }

    if ( ! function_exists( 'get_bloginfo' ) ) {
        function get_bloginfo( $show = '' ) {
            if ( 'name' === $show ) return 'Test Site';
            return '';
        }
    }

    if ( ! function_exists( 'date_i18n' ) ) {
        function date_i18n( $format, $timestamp = null ) {
            return gmdate( $format, $timestamp ?: time() );
        }
    }

    if ( ! function_exists( 'get_the_title' ) ) {
        function get_the_title( $post_id ) {
            $post = $GLOBALS['_culture_test_posts'][ $post_id ] ?? null;
            return $post ? $post->post_title : '';
        }
    }

    if ( ! function_exists( 'number_format_i18n' ) ) {
        function number_format_i18n( $number, $decimals = 0 ) {
            return number_format( $number, $decimals );
        }
    }

    // ── Mock $wpdb with attendance table support ──
    $GLOBALS['wpdb'] = new class {
        public $prefix   = 'wp_';
        public $postmeta = 'wp_postmeta';
        public $comments = 'wp_comments';
        public $posts    = 'wp_posts';
        public $users    = 'wp_users';

        public function get_var( $query ) {
            // Check attendance store for existing records.
            $store = $GLOBALS['_culture_test_attendance'];
            foreach ( $store as $record ) {
                // Simple pattern match for duplicate check-in queries.
                if ( strpos( $query, "status = 'checked_in'" ) !== false
                    || strpos( $query, "status IN ('rsvp', 'checked_in')" ) !== false ) {
                    return null; // Default: no existing record.
                }
            }
            return 0;
        }

        public function prepare( $query, ...$args ) {
            // Simple placeholder replacement for testing.
            foreach ( $args as $arg ) {
                $pos = strpos( $query, '%d' );
                if ( $pos === false ) {
                    $pos = strpos( $query, '%s' );
                }
                if ( $pos !== false ) {
                    $query = substr_replace( $query, "'" . $arg . "'", $pos, 2 );
                }
            }
            return $query;
        }

        public function insert( $table, $data, $format = null ) {
            $GLOBALS['_culture_test_attendance_id']++;
            $data['id'] = $GLOBALS['_culture_test_attendance_id'];
            $GLOBALS['_culture_test_attendance'][] = $data;
            return 1;
        }

        public function update( $table, $data, $where, $format = null, $where_format = null ) {
            foreach ( $GLOBALS['_culture_test_attendance'] as &$record ) {
                if ( isset( $where['id'] ) && $record['id'] == $where['id'] ) {
                    $record = array_merge( $record, $data );
                    return 1;
                }
            }
            return 0;
        }
    };

    // ── WP_Error mock ──
    if ( ! class_exists( 'WP_Error' ) ) {
        class WP_Error {
            private $code;
            private $message;
            private $data;

            public function __construct( $code = '', $message = '', $data = '' ) {
                $this->code    = $code;
                $this->message = $message;
                $this->data    = $data;
            }

            public function get_error_code() { return $this->code; }
            public function get_error_message() { return $this->message; }
            public function get_error_data() { return $this->data; }
        }

        function is_wp_error( $thing ) {
            return $thing instanceof WP_Error;
        }
    }

    if ( ! function_exists( 'add_filter' ) ) {
        function add_filter( ...$args ) {}
    }

    if ( ! function_exists( 'sanitize_hex_color' ) ) {
        function sanitize_hex_color( $color ) {
            if ( preg_match( '/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/', $color ) ) {
                return $color;
            }
            return '';
        }
    }

    // ── Load testable classes ──
    require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-settings.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-email-templates.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-gamification.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-referrals.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-cron.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-emails.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-rest-api.php';
    require_once CULTURE_PLUGIN_DIR . 'includes/payment/class-culture-paystack.php';
}
