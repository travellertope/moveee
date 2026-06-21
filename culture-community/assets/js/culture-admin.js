/**
 * Culture Community - Admin JavaScript
 */
(function($) {
    'use strict';

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
