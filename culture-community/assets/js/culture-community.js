/**
 * Culture Community - Frontend JavaScript
 */
(function($) {
    'use strict';

    var Culture = {
        init: function() {
            this.bindRSVP();
            this.bindReactions();
            this.bindCommentToggle();
            this.bindCommentForm();
            this.bindPaymentInit();
            this.bindCopyReferral();
            this.bindRegistration();
        },

        /**
         * RSVP button handler.
         */
        bindRSVP: function() {
            $(document).on('click', '.js-culture-rsvp', function(e) {
                e.preventDefault();
                var $btn = $(this);
                var eventId = $btn.data('event-id');

                $btn.prop('disabled', true).text('Processing...');

                $.post(cultureData.ajaxUrl, {
                    action: 'culture_rsvp',
                    event_id: eventId,
                    nonce: cultureData.nonce
                }, function(response) {
                    if (response.success) {
                        $btn.text('RSVP\'d!').addClass('culture-btn--success');
                        Culture.showNotice(response.data.message, 'success');
                    } else {
                        $btn.prop('disabled', false).text('RSVP');
                        if (response.data && response.data.upgrade_required) {
                            Culture.showUpgradePrompt(response.data.message);
                        } else {
                            Culture.showNotice(response.data.message, 'error');
                        }
                    }
                }).fail(function() {
                    $btn.prop('disabled', false).text('RSVP');
                    Culture.showNotice('Something went wrong. Please try again.', 'error');
                });
            });
        },

        /**
         * Paragraph reaction handler.
         */
        bindReactions: function() {
            $(document).on('click', '.js-culture-react', function(e) {
                e.preventDefault();
                var $btn = $(this);

                $.post(cultureData.ajaxUrl, {
                    action: 'culture_react',
                    post_id: $btn.data('post-id'),
                    paragraph: $btn.data('paragraph'),
                    reaction: $btn.data('reaction'),
                    nonce: cultureData.nonce
                }, function(response) {
                    if (response.success) {
                        var $container = $btn.closest('.culture-digest__reactions');
                        $.each(response.data.counts, function(key, count) {
                            $container.find('[data-reaction="' + key + '"] .culture-digest__reaction-count').text(count);
                        });
                    }
                });
            });
        },

        /**
         * Toggle paragraph comments.
         */
        bindCommentToggle: function() {
            $(document).on('click', '.js-culture-comment-toggle', function(e) {
                e.preventDefault();
                $(this).closest('.culture-digest__paragraph')
                       .find('.culture-digest__comments')
                       .slideToggle(200);
            });
        },

        /**
         * Paragraph comment form submission.
         */
        bindCommentForm: function() {
            $(document).on('submit', '.js-culture-comment-form', function(e) {
                e.preventDefault();
                var $form = $(this);
                var $textarea = $form.find('textarea');
                var comment = $textarea.val().trim();

                if (!comment) return;

                $.post(cultureData.ajaxUrl, {
                    action: 'culture_paragraph_comment',
                    post_id: $form.data('post-id'),
                    paragraph: $form.data('paragraph'),
                    comment: comment,
                    nonce: cultureData.nonce
                }, function(response) {
                    if (response.success) {
                        var $comments = $form.closest('.culture-digest__comments');
                        $comments.find('.js-culture-comment-form').before(
                            '<div class="culture-digest__comment"><strong>' +
                            response.data.author + '</strong><p>' +
                            response.data.comment + '</p></div>'
                        );
                        $textarea.val('');
                    }
                });
            });
        },

        /**
         * Payment initialization for Patron upgrade.
         */
        bindPaymentInit: function() {
            $(document).on('click', '.js-culture-upgrade', function(e) {
                e.preventDefault();
                var $btn = $(this);
                $btn.prop('disabled', true).text('Redirecting...');

                $.post(cultureData.ajaxUrl, {
                    action: 'culture_init_payment',
                    nonce: cultureData.nonce
                }, function(response) {
                    if (response.success && response.data.authorization_url) {
                        window.location.href = response.data.authorization_url;
                    } else {
                        $btn.prop('disabled', false).text('Upgrade to Patron');
                        Culture.showNotice(response.data.message || 'Payment initialization failed.', 'error');
                    }
                }).fail(function() {
                    $btn.prop('disabled', false).text('Upgrade to Patron');
                });
            });
        },

        /**
         * Show a notification message.
         */
        showNotice: function(message, type) {
            var $notice = $('<div class="culture-notice culture-notice--' + type + '">' + message + '</div>');
            $('body').append($notice);
            setTimeout(function() {
                $notice.addClass('culture-notice--visible');
            }, 10);
            setTimeout(function() {
                $notice.removeClass('culture-notice--visible');
                setTimeout(function() { $notice.remove(); }, 300);
            }, 4000);
        },

        /**
         * Show upgrade prompt overlay.
         */
        /**
         * Copy referral link to clipboard.
         */
        bindCopyReferral: function() {
            $(document).on('click', '.js-culture-copy-referral', function(e) {
                e.preventDefault();
                var targetId = $(this).data('target');
                var $input = $('#' + targetId);
                if (!$input.length) return;

                $input[0].select();
                $input[0].setSelectionRange(0, 99999);

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText($input.val()).then(function() {
                        Culture.showNotice('Referral link copied!', 'success');
                    });
                } else {
                    document.execCommand('copy');
                    Culture.showNotice('Referral link copied!', 'success');
                }
            });
        },

        /**
         * Multi-step registration wizard.
         */
        bindRegistration: function() {
            var $form = $('.js-culture-register-form');
            if (!$form.length) return;

            function goToStep(step) {
                $form.find('.culture-register__step').hide();
                $form.find('.culture-register__step[data-step="' + step + '"]').show();

                // Update progress indicator.
                $form.find('.culture-register__progress-step').each(function() {
                    var ind = parseInt($(this).data('indicator'), 10);
                    $(this).toggleClass('culture-register__progress-step--active', ind <= step);
                    $(this).toggleClass('culture-register__progress-step--current', ind === step);
                });
                $form.find('.culture-register__progress-bar').each(function(i) {
                    $(this).find('.culture-register__progress-fill')
                        .toggleClass('culture-register__progress-fill--done', (i + 1) < step);
                });
            }

            // Next step buttons.
            $form.on('click', '.js-culture-step-next', function(e) {
                e.preventDefault();
                var $btn = $(this);
                var $currentStep = $btn.closest('.culture-register__step');
                var nextStep = $btn.data('next');

                // Validate required fields in the current step.
                var valid = true;
                $currentStep.find('input[required], select[required]').each(function() {
                    if (!this.value.trim()) {
                        valid = false;
                        $(this).addClass('culture-register__input--error');
                    } else {
                        $(this).removeClass('culture-register__input--error');
                    }
                });

                // Email format check.
                var $email = $currentStep.find('input[type="email"]');
                if ($email.length && $email.val() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($email.val())) {
                    valid = false;
                    $email.addClass('culture-register__input--error');
                }

                // Password length check.
                var $password = $currentStep.find('input[type="password"]');
                if ($password.length && $password.val() && $password.val().length < 8) {
                    valid = false;
                    $password.addClass('culture-register__input--error');
                }

                if (!valid) return;

                goToStep(nextStep);
            });

            // Previous step buttons.
            $form.on('click', '.js-culture-step-prev', function(e) {
                e.preventDefault();
                goToStep($(this).data('prev'));
            });

            // Clear error state on input.
            $form.on('input change', '.culture-register__input--error', function() {
                $(this).removeClass('culture-register__input--error');
            });

            // Form submission via AJAX.
            $form.on('submit', function(e) {
                e.preventDefault();
                var $submit = $form.find('.js-culture-register-submit');
                var $error = $form.find('.culture-register__error');

                $submit.prop('disabled', true).text('Creating account...');
                $error.hide();

                $.post(cultureData.ajaxUrl, {
                    action: 'culture_register_user',
                    username: $form.find('[name="username"]').val(),
                    email: $form.find('[name="email"]').val(),
                    password: $form.find('[name="password"]').val(),
                    display_name: $form.find('[name="display_name"]').val(),
                    tier: $form.find('[name="tier"]:checked').val(),
                    culture_referral_code: $form.find('[name="culture_referral_code"]').val(),
                    culture_register_nonce_field: $form.find('[name="culture_register_nonce_field"]').val()
                }, function(response) {
                    if (response.success) {
                        Culture.showNotice(response.data.message, 'success');
                        if (response.data.redirect) {
                            window.location.href = response.data.redirect;
                        }
                    } else {
                        $submit.prop('disabled', false).text('Complete Registration');
                        $error.text(response.data.message).show();
                    }
                }).fail(function() {
                    $submit.prop('disabled', false).text('Complete Registration');
                    $error.text('Something went wrong. Please try again.').show();
                });
            });
        },

        showUpgradePrompt: function(message) {
            var $overlay = $(
                '<div class="culture-overlay">' +
                    '<div class="culture-overlay__content">' +
                        '<h3>Upgrade Required</h3>' +
                        '<p>' + message + '</p>' +
                        '<button class="culture-btn culture-btn--primary js-culture-upgrade">Upgrade to Patron</button>' +
                        '<button class="culture-btn culture-btn--secondary js-culture-overlay-close">Not Now</button>' +
                    '</div>' +
                '</div>'
            );
            $('body').append($overlay);
            $(document).on('click', '.js-culture-overlay-close', function() {
                $overlay.remove();
            });
        }
    };

    $(document).ready(function() {
        Culture.init();
    });

})(jQuery);
