/* global cultureNLSend, jQuery */
( function ( $ ) {
    'use strict';

    var pollInterval = null;

    /**
     * Show a feedback message in the meta box.
     *
     * @param {string} message
     * @param {string} type  'success' | 'error' | 'info'
     */
    function showFeedback( message, type ) {
        var $fb = $( '.js-nl-feedback' );
        $fb
            .removeClass( 'success error info' )
            .addClass( type )
            .html( message )
            .fadeIn( 200 );

        if ( type === 'success' ) {
            setTimeout( function () { $fb.fadeOut( 400 ); }, 5000 );
        }
    }

    /**
     * Update the progress bar and text from a status payload.
     *
     * @param {Object} data  Response data from ajax_get_status.
     */
    function updateProgress( data ) {
        $( '.js-nl-fill' ).css( 'width', data.percent + '%' );
        $( '.js-nl-progress-text' ).text(
            data.offset.toLocaleString() + ' / ' + data.total.toLocaleString()
        );
    }

    /**
     * Poll the server for send progress every 8 seconds while status === 'sending'.
     */
    function startPolling() {
        if ( pollInterval ) {
            return;
        }

        pollInterval = setInterval( function () {
            $.post( cultureNLSend.ajaxUrl, {
                action:  'culture_nl_get_status',
                nonce:   cultureNLSend.nonce,
                post_id: cultureNLSend.postId,
            }, function ( res ) {
                if ( ! res.success ) {
                    return;
                }

                var data = res.data;

                if ( data.status === 'sending' ) {
                    updateProgress( data );
                } else {
                    // Done — reload the meta box area so the final state renders.
                    clearInterval( pollInterval );
                    pollInterval = null;
                    location.reload();
                }
            } );
        }, 8000 );
    }

    /**
     * Update the subscriber count display when the list or segment dropdown changes.
     */
    function updateCountDisplay() {
        var $box       = $( '.culture-nl-box' );
        var counts     = $box.data( 'counts' )     || {};
        var listLabels = $box.data( 'list-labels' ) || {};
        var segLabels  = $box.data( 'seg-labels' )  || {};

        var list    = $( '[name="culture_nl_list"]' ).val()    || 'getmelit';
        var segment = $( '[name="culture_nl_segment"]' ).val() || '';

        var listCounts = counts[ list ] || {};
        var count      = segment ? ( listCounts[ segment ] || 0 ) : ( listCounts[ '' ] || 0 );

        var label = listLabels[ list ] || list;
        if ( segment && segLabels[ segment ] ) {
            label += ' · ' + segLabels[ segment ];
        }
        label += ' Subscribers';

        $( '.js-nl-count-num' ).text( count.toLocaleString() );
        $( '.js-nl-count-label' ).text( label );
    }

    $( function () {

        // Start polling immediately if the page loads mid-send.
        if ( $( '.js-nl-status' ).data( 'status' ) === 'sending' ) {
            startPolling();
        }

        // Live-update count when list or segment changes.
        $( document ).on( 'change', '[name="culture_nl_list"], [name="culture_nl_segment"]', updateCountDisplay );

        // ── Send Test ──────────────────────────────────────────────
        $( document ).on( 'click', '.js-nl-test-btn', function () {
            var $btn       = $( this );
            var testEmail  = $( '#culture-nl-test-email' ).val().trim();

            if ( ! testEmail ) {
                showFeedback( 'Please enter an email address.', 'error' );
                return;
            }

            $btn.prop( 'disabled', true ).text( cultureNLSend.i18n.sending );

            $.post( cultureNLSend.ajaxUrl, {
                action:      'culture_nl_send_test',
                nonce:       cultureNLSend.nonce,
                post_id:     cultureNLSend.postId,
                test_email:  testEmail,
            }, function ( res ) {
                $btn.prop( 'disabled', false ).text( cultureNLSend.i18n.sendTest );

                if ( res.success ) {
                    showFeedback( '✓ ' + res.data.message, 'success' );
                } else {
                    showFeedback( '✗ ' + ( res.data && res.data.message ? res.data.message : 'Send failed.' ), 'error' );
                }
            } ).fail( function () {
                $btn.prop( 'disabled', false ).text( cultureNLSend.i18n.sendTest );
                showFeedback( '✗ Request failed. Check your connection.', 'error' );
            } );
        } );

        // ── Send Issue ─────────────────────────────────────────────
        $( document ).on( 'click', '.js-nl-send-btn', function () {
            var $btn       = $( this );
            var isResend   = $btn.find( '.dashicons-controls-repeat' ).length > 0;
            var confirmMsg = isResend
                ? cultureNLSend.i18n.confirmResend
                : cultureNLSend.i18n.confirmSend;

            if ( ! window.confirm( confirmMsg ) ) {
                return;
            }

            $btn.prop( 'disabled', true ).text( cultureNLSend.i18n.sending );
            showFeedback( 'Queueing send job…', 'info' );

            $.post( cultureNLSend.ajaxUrl, {
                action:  'culture_nl_send_issue',
                nonce:   cultureNLSend.nonce,
                post_id: cultureNLSend.postId,
            }, function ( res ) {
                if ( res.success ) {
                    showFeedback( '✓ ' + res.data.message, 'success' );
                    // Give WP-Cron 6 seconds to fire the first batch, then start polling.
                    setTimeout( function () { location.reload(); }, 6000 );
                } else {
                    $btn.prop( 'disabled', false );
                    showFeedback( '✗ ' + ( res.data && res.data.message ? res.data.message : 'Could not queue send.' ), 'error' );
                }
            } ).fail( function () {
                $btn.prop( 'disabled', false );
                showFeedback( '✗ Request failed. Check your connection.', 'error' );
            } );
        } );

    } );

} )( jQuery );
