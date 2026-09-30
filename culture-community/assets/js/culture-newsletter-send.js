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
     * Gathers every checked segment-filter checkbox into
     * { axisType: [slug, slug, ...], ... } — the shape both the recount AJAX
     * call and the Send Test / Send Issue calls post as `segment`.
     */
    function currentSegmentFilters() {
        var filters = {};
        $( '.js-nl-segment-filters input[type="checkbox"]:checked' ).each( function () {
            // name="culture_nl_segment[axis][]" — pull "axis" out of it.
            var match = /\[([^\]]+)\]\[\]$/.exec( this.name );
            if ( ! match ) {
                return;
            }
            var axis = match[ 1 ];
            filters[ axis ] = filters[ axis ] || [];
            filters[ axis ].push( this.value );
        } );
        return filters;
    }

    /**
     * Recomputes the subscriber count via AJAX whenever the list or any
     * segment-filter checkbox changes — a client-side lookup table (the old
     * approach) only worked when "segment" was one flat dropdown; it can't
     * cover every combination of Region/Age/Tier/a custom axis someone might
     * check at once.
     */
    function updateCountDisplay() {
        var $box       = $( '.culture-nl-box' );
        var listLabels = $box.data( 'list-labels' ) || {};
        var list       = $( '.js-nl-list-select' ).val() || Object.keys( listLabels )[ 0 ] || 'getmelit';

        $.post( cultureNLSend.ajaxUrl, {
            action:  'culture_nl_recount',
            nonce:   cultureNLSend.nonce,
            list:    list,
            segment: currentSegmentFilters(),
        }, function ( res ) {
            if ( ! res.success ) {
                return;
            }
            var count = res.data.count;
            var label = listLabels[ list ] || list;
            if ( res.data.summary ) {
                label += ' · ' + res.data.summary;
            }
            label += ' Subscribers';

            $( '.js-nl-count-num' ).text( count.toLocaleString() );
            $( '.js-nl-count-label' ).text( label );

            $( '.js-nl-notice-count' ).text( count.toLocaleString() );
            $( '.js-nl-notice-list' ).text( listLabels[ list ] || list );

            if ( 0 === count ) {
                $( '.js-nl-notice-empty' ).show();
                $( '.js-nl-notice-full' ).hide();
            } else {
                $( '.js-nl-notice-empty' ).hide();
                $( '.js-nl-notice-full' ).show();
            }

            $( '.js-nl-send-btn' ).prop( 'disabled', 0 === count );
        } );
    }

    $( function () {

        // Start polling immediately if the page loads mid-send.
        if ( $( '.js-nl-status' ).data( 'status' ) === 'sending' ) {
            startPolling();
        }

        // Live-update count when the list select or any segment-filter
        // checkbox changes — .js-nl-segment-check is on every checkbox
        // regardless of which axis it belongs to (name="culture_nl_segment[axis][]",
        // which a plain [name="culture_nl_segment"] attribute selector would
        // never exact-match).
        $( document ).on( 'change', '.js-nl-list-select, .js-nl-segment-check', updateCountDisplay );

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
                list:        $( '.js-nl-list-select' ).val() || '',
                segment:     currentSegmentFilters(),
                edition:     $( '#culture-nl-test-edition' ).val()    || '',
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
                list:    $( '.js-nl-list-select' ).val() || '',
                segment: currentSegmentFilters(),
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
