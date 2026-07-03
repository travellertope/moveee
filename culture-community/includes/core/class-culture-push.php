<?php
/**
 * Expo push notification delivery.
 *
 * Reads Expo push tokens stored in _culture_fcm_tokens usermeta and calls
 * the Expo Push API (https://exp.host/--/api/v2/push/send).
 *
 * Usage:
 *   Culture_Push::send( $user_id, 'Title', 'Body text', '/deep/link' );
 */
class Culture_Push {

    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send a push notification to all registered devices for a user.
     *
     * @param int    $user_id
     * @param string $title
     * @param string $body
     * @param string $data_url  Deep-link path (e.g. '/member/wallet'). Optional.
     */
    public static function send( int $user_id, string $title, string $body, string $data_url = '' ) : void {
        $tokens = (array) get_user_meta( $user_id, '_culture_fcm_tokens', true );
        $tokens = array_filter( $tokens, 'is_string' );
        if ( empty( $tokens ) ) {
            return;
        }

        $messages = array();
        foreach ( $tokens as $token ) {
            $msg = array(
                'to'    => $token,
                'title' => $title,
                'body'  => $body,
                'sound' => 'default',
            );
            if ( $data_url !== '' ) {
                $msg['data'] = array( 'url' => $data_url );
            }
            $messages[] = $msg;
        }

        wp_remote_post(
            self::EXPO_PUSH_URL,
            array(
                'headers'    => array(
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ),
                'body'       => wp_json_encode( $messages ),
                'timeout'    => 10,
                'blocking'   => false, // fire-and-forget; don't slow down the request
            )
        );
    }
}
