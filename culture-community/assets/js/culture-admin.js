/**
 * Culture Community - Admin JavaScript (Chapter Leader Dashboard)
 */
(function($) {
    'use strict';

    /**
     * Manual check-in by user ID.
     */
    $(document).on('click', '.js-culture-checkin-btn', function() {
        var eventId = $('#culture-scanner-event').val();
        var userId = $('#culture-scanner-user-id').val();

        if (!eventId) {
            showResult('Please select an event first.', 'error');
            return;
        }
        if (!userId) {
            showResult('Please enter a user ID.', 'error');
            return;
        }

        performCheckin(userId, eventId);
    });

    /**
     * QR code data check-in.
     */
    $(document).on('click', '.js-culture-qr-checkin-btn', function() {
        var eventId = $('#culture-scanner-event').val();
        var qrRaw = $('#culture-scanner-qr-data').val().trim();

        if (!eventId) {
            showResult('Please select an event first.', 'error');
            return;
        }
        if (!qrRaw) {
            showResult('Please paste QR code data.', 'error');
            return;
        }

        try {
            var qrData = JSON.parse(qrRaw);
            if (!qrData.uid) {
                showResult('Invalid QR code data: missing user ID.', 'error');
                return;
            }
            performCheckin(qrData.uid, eventId);
        } catch (e) {
            showResult('Invalid QR code format. Expected JSON.', 'error');
        }
    });

    /**
     * Perform the check-in API call.
     */
    function performCheckin(userId, eventId) {
        showResult('Processing check-in...', 'info');

        $.ajax({
            url: cultureAdmin.restUrl + 'check-in',
            method: 'POST',
            headers: { 'X-WP-Nonce': cultureAdmin.restNonce },
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: parseInt(userId, 10),
                event_id: parseInt(eventId, 10)
            }),
            success: function(response) {
                var msg = '<strong>' + response.user.display_name + '</strong> checked in successfully!';
                msg += '<br>Points: ' + response.user.points;
                showResult(msg, 'success');
                $('#culture-scanner-user-id').val('');
                $('#culture-scanner-qr-data').val('');
            },
            error: function(xhr) {
                var data = xhr.responseJSON || {};
                showResult(data.message || 'Check-in failed.', 'error');
            }
        });
    }

    /**
     * Display result message in the scanner result area.
     */
    function showResult(message, type) {
        var $result = $('#culture-scanner-result');
        var $content = $result.find('.culture-admin-scanner__result-content');

        $content.html(message);
        $result
            .removeClass('culture-admin-result--success culture-admin-result--error culture-admin-result--info')
            .addClass('culture-admin-result--' + type)
            .show();
    }

    /**
     * Registration form step navigation.
     */
    $(document).on('click', '.js-culture-step-next', function() {
        var nextStep = $(this).data('next');
        var $form = $(this).closest('.culture-register__form');
        var $currentStep = $(this).closest('.culture-register__step');

        // Basic validation of current step fields.
        var valid = true;
        $currentStep.find('input[required], select[required]').each(function() {
            if (!this.checkValidity()) {
                this.reportValidity();
                valid = false;
                return false;
            }
        });
        if (!valid) return;

        // Show/hide secondary chapter based on tier selection.
        if (nextStep === 3) {
            var tier = $form.find('input[name="tier"]:checked').val();
            $form.find('.culture-register__field--secondary').toggle(tier === 'patron');
        }

        $currentStep.hide();
        $form.find('[data-step="' + nextStep + '"]').show();
    });

    $(document).on('click', '.js-culture-step-prev', function() {
        var prevStep = $(this).data('prev');
        $(this).closest('.culture-register__step').hide();
        $(this).closest('.culture-register__form').find('[data-step="' + prevStep + '"]').show();
    });

    /**
     * Registration form submission.
     */
    $(document).on('submit', '.js-culture-register-form', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $btn = $form.find('.js-culture-register-submit');
        var $error = $form.find('.culture-register__error');

        $btn.prop('disabled', true).text('Creating account...');
        $error.hide();

        var formData = $form.serialize() + '&action=culture_register_user';

        $.post(cultureData.ajaxUrl, formData, function(response) {
            if (response.success) {
                if (response.data.redirect) {
                    window.location.href = response.data.redirect;
                }
            } else {
                $error.text(response.data.message).show();
                $btn.prop('disabled', false).text('Complete Registration');
            }
        }).fail(function() {
            $error.text('Something went wrong. Please try again.').show();
            $btn.prop('disabled', false).text('Complete Registration');
        });
    });

})(jQuery);
