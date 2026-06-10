<?php
/**
 * Registration form with tier selection and chapter picker.
 *
 * Shortcode: [culture_register]
 * Renders a multi-step registration wizard:
 *   Step 1: Account details (username, email, password)
 *   Step 2: Choose tier (Citizen free / Patron paid)
 *   Step 3: Select primary chapter (+ secondary if Patron)
 *   Step 4: Redirect to Paystack if Patron, or complete registration
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Registration {

    public static function init() {
        add_shortcode( 'culture_register', array( __CLASS__, 'render_form' ) );
        add_action( 'wp_ajax_nopriv_culture_register_user', array( __CLASS__, 'handle_registration' ) );
        add_action( 'wp_ajax_culture_register_user', array( __CLASS__, 'handle_registration' ) );
    }

    /**
     * [culture_register] - Render the registration form.
     */
    public static function render_form( $atts ) {
        if ( is_user_logged_in() ) {
            return '<p style="text-align:center;padding:20px;background:#ecf0f1;border-radius:8px;color:#7f8c8d;">' . esc_html__( 'You are already registered and logged in.', 'culture-community' ) . '</p>';
        }

        // Check for referral code in cookie or URL.
        $referral_code = '';
        if ( isset( $_COOKIE['culture_ref'] ) ) {
            $referral_code = sanitize_key( $_COOKIE['culture_ref'] );
        } elseif ( isset( $_GET['ref'] ) ) {
            $referral_code = sanitize_key( $_GET['ref'] );
        }

        $ajax_url = admin_url( 'admin-ajax.php' );

        ob_start();
        ?>
        <style>
        /* ── Registration Form — self-contained styles ── */
        .cr{max-width:640px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
        .cr *,.cr *::before,.cr *::after{box-sizing:border-box}
        .cr__card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1);padding:32px}
        /* Progress */
        .cr__progress{display:flex;align-items:flex-start;justify-content:center;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #e0e0e0}
        .cr__pstep{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0}
        .cr__pnum{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#ecf0f1;color:#7f8c8d;font-size:15px;font-weight:700;transition:background .3s,color .3s}
        .cr__pstep--active .cr__pnum{background:#e67e22;color:#fff}
        .cr__plabel{font-size:12px;color:#7f8c8d;font-weight:600;transition:color .3s}
        .cr__pstep--active .cr__plabel{color:#2c3e50}
        .cr__pbar{flex:1;height:3px;background:#ecf0f1;margin:17px 14px 0;border-radius:3px;overflow:hidden}
        .cr__pfill{width:0;height:100%;background:#e67e22;border-radius:3px;transition:width .3s}
        .cr__pfill--done{width:100%}
        /* Steps */
        .cr__step{display:none}
        .cr__step--active{display:block}
        .cr__step h2{margin:0 0 24px;font-size:22px;color:#2c3e50;font-weight:700}
        /* Fields */
        .cr__field{margin-bottom:20px}
        .cr__field label{display:block;margin-bottom:6px;font-weight:600;font-size:14px;color:#2c3e50}
        .cr__field input,.cr__field select{display:block;width:100%;padding:11px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;font-family:inherit;color:#2c3e50;background:#fff;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;appearance:none}
        .cr__field input:focus,.cr__field select:focus{outline:none;border-color:#e67e22;box-shadow:0 0 0 3px rgba(230,126,34,.15)}
        .cr__field input.cr__err,.cr__field select.cr__err{border-color:#e74c3c;box-shadow:0 0 0 3px rgba(231,76,60,.12)}
        /* Tier cards */
        .cr__tiers{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:8px}
        .cr__tiercard{cursor:pointer;display:block}
        .cr__tiercard input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}
        .cr__tierbody{padding:20px;border:2px solid #ddd;border-radius:12px;transition:border-color .2s,background .2s,box-shadow .2s;height:100%}
        .cr__tierbody:hover{border-color:#bbb}
        .cr__tiercard input:checked+.cr__tierbody{border-color:#e67e22;background:rgba(230,126,34,.04);box-shadow:0 0 0 3px rgba(230,126,34,.12)}
        .cr__tierbody h3{margin:0 0 4px;font-size:18px;color:#2c3e50}
        .cr__tierprice{display:inline-block;font-weight:700;color:#e67e22;margin-bottom:12px;font-size:15px}
        .cr__tierbody ul{margin:0;padding:0 0 0 18px;font-size:13px;color:#7f8c8d;line-height:1.7}
        .cr__tierbody li{margin-bottom:4px}
        /* Nav */
        .cr__nav{display:flex;gap:12px;justify-content:space-between;align-items:center;margin-top:24px;padding-top:20px;border-top:1px solid #e0e0e0}
        /* Buttons */
        .cr__btn{display:inline-block;padding:12px 24px;border:none;border-radius:8px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .2s,opacity .2s;text-decoration:none;line-height:1.4}
        .cr__btn:disabled{opacity:.6;cursor:not-allowed}
        .cr__btn--primary{background:#e67e22;color:#fff}
        .cr__btn--primary:hover{background:#d35400}
        .cr__btn--secondary{background:#ecf0f1;color:#2c3e50}
        .cr__btn--secondary:hover{background:#dde1e3}
        .cr__btn--full{display:block;width:100%;text-align:center}
        /* Error */
        .cr__errmsg{margin-top:16px;padding:12px 16px;background:#fef2f2;color:#e74c3c;border:1px solid rgba(231,76,60,.2);border-radius:8px;font-size:14px;display:none}
        .cr__errmsg--visible{display:block}
        /* Checkbox */
        .cr__check{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:500;color:#2c3e50}
        .cr__check input{width:18px;height:18px;accent-color:#e67e22;cursor:pointer;margin:0}
        /* Conditional fields */
        .cr__field--whatsapp{display:none}
        .cr__field--whatsapp.cr__field--show{display:block}
        /* Mobile */
        @media(max-width:600px){
            .cr__card{padding:20px 16px}
            .cr__tiers{grid-template-columns:1fr}
            .cr__tierbody{height:auto}
            .cr__plabel{font-size:11px}
            .cr__pbar{margin:17px 6px 0}
        }
        </style>

        <div class="cr" id="culture-register">
            <form class="cr__card" id="cr-form" novalidate>
                <?php wp_nonce_field( 'culture_register_nonce', 'culture_register_nonce_field' ); ?>
                <input type="hidden" name="culture_referral_code" value="<?php echo esc_attr( $referral_code ); ?>" />

                <!-- Progress -->
                <div class="cr__progress" id="cr-progress">
                    <div class="cr__pstep cr__pstep--active" data-ind="1">
                        <span class="cr__pnum">1</span>
                        <span class="cr__plabel"><?php esc_html_e( 'Account', 'culture-community' ); ?></span>
                    </div>
                    <div class="cr__pbar"><div class="cr__pfill" id="cr-bar-1"></div></div>
                    <div class="cr__pstep" data-ind="2">
                        <span class="cr__pnum">2</span>
                        <span class="cr__plabel"><?php esc_html_e( 'Membership', 'culture-community' ); ?></span>
                    </div>
                </div>

                <!-- Step 1: Account -->
                <div class="cr__step cr__step--active" data-step="1">
                    <h2><?php esc_html_e( 'Create Your Account', 'culture-community' ); ?></h2>
                    <div class="cr__field">
                        <label for="cr_username"><?php esc_html_e( 'Username', 'culture-community' ); ?></label>
                        <input type="text" id="cr_username" name="username" required autocomplete="username" />
                    </div>
                    <div class="cr__field">
                        <label for="cr_email"><?php esc_html_e( 'Email', 'culture-community' ); ?></label>
                        <input type="email" id="cr_email" name="email" required autocomplete="email" />
                    </div>
                    <div class="cr__field">
                        <label for="cr_password"><?php esc_html_e( 'Password', 'culture-community' ); ?></label>
                        <input type="password" id="cr_password" name="password" required minlength="8" autocomplete="new-password" />
                    </div>
                    <div class="cr__field">
                        <label for="cr_display_name"><?php esc_html_e( 'Display Name', 'culture-community' ); ?></label>
                        <input type="text" id="cr_display_name" name="display_name" required />
                    </div>
                    <div class="cr__field">
                        <label for="cr_phone"><?php esc_html_e( 'Phone Number', 'culture-community' ); ?></label>
                        <input type="tel" id="cr_phone" name="phone" required placeholder="+234 800 000 0000" autocomplete="tel" />
                    </div>
                    <div class="cr__field">
                        <label class="cr__check">
                            <input type="checkbox" id="cr_diff_whatsapp" name="diff_whatsapp" value="1" />
                            <span><?php esc_html_e( 'Different phone number for WhatsApp', 'culture-community' ); ?></span>
                        </label>
                    </div>
                    <div class="cr__field cr__field--whatsapp" id="cr-whatsapp-wrap">
                        <label for="cr_whatsapp"><?php esc_html_e( 'WhatsApp Number', 'culture-community' ); ?></label>
                        <input type="tel" id="cr_whatsapp" name="whatsapp" placeholder="+234 800 000 0000" autocomplete="tel" />
                    </div>
                    <div class="cr__nav">
                        <button type="button" class="cr__btn cr__btn--primary cr__btn--full" data-next="2">
                            <?php esc_html_e( 'Next: Choose Your Tier', 'culture-community' ); ?>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Tier Selection -->
                <div class="cr__step" data-step="2">
                    <h2><?php esc_html_e( 'Choose Your Membership', 'culture-community' ); ?></h2>
                    <div class="cr__tiers">
                        <label class="cr__tiercard">
                            <input type="radio" name="tier" value="citizen" checked />
                            <div class="cr__tierbody">
                                <h3><?php esc_html_e( 'Citizen', 'culture-community' ); ?></h3>
                                <span class="cr__tierprice"><?php esc_html_e( 'Free', 'culture-community' ); ?></span>
                                <ul>
                                    <li><?php esc_html_e( 'Virtual event access', 'culture-community' ); ?></li>
                                    <li><?php esc_html_e( 'GetMeLit & Culture Drop newsletters', 'culture-community' ); ?></li>
                                    <li><?php esc_html_e( 'Gamification & badges', 'culture-community' ); ?></li>
                                </ul>
                            </div>
                        </label>
                        <label class="cr__tiercard">
                            <input type="radio" name="tier" value="patron" />
                            <div class="cr__tierbody">
                                <h3><?php esc_html_e( 'Patron', 'culture-community' ); ?></h3>
                                <span class="cr__tierprice"><?php esc_html_e( 'Paid', 'culture-community' ); ?></span>
                                <ul>
                                    <li><?php esc_html_e( 'Everything in Citizen, plus:', 'culture-community' ); ?></li>
                                    <li><?php esc_html_e( 'Physical event access', 'culture-community' ); ?></li>
                                    <li><?php esc_html_e( 'Priority RSVP', 'culture-community' ); ?></li>
                                </ul>
                            </div>
                        </label>
                    </div>
                    <div class="cr__nav">
                        <button type="button" class="cr__btn cr__btn--secondary" data-prev="1">
                            <?php esc_html_e( 'Back', 'culture-community' ); ?>
                        </button>
                        <button type="submit" class="cr__btn cr__btn--primary" id="cr-submit">
                            <?php esc_html_e( 'Complete Registration', 'culture-community' ); ?>
                        </button>
                    </div>
                </div>

                <div class="cr__errmsg" id="cr-error"></div>
            </form>
        </div>

        <script>
        (function(){
            var form = document.getElementById('cr-form');
            if (!form) return;

            var ajaxUrl = <?php echo wp_json_encode( $ajax_url ); ?>;
            var currentStep = 1;

            function goToStep(step) {
                currentStep = step;
                var steps = form.querySelectorAll('.cr__step');
                for (var i = 0; i < steps.length; i++) {
                    steps[i].classList.toggle('cr__step--active', parseInt(steps[i].getAttribute('data-step')) === step);
                }
                var indicators = document.querySelectorAll('#cr-progress .cr__pstep');
                for (var j = 0; j < indicators.length; j++) {
                    var ind = parseInt(indicators[j].getAttribute('data-ind'));
                    indicators[j].classList.toggle('cr__pstep--active', ind <= step);
                }
                var bar1 = document.getElementById('cr-bar-1');
                if (bar1) bar1.classList.toggle('cr__pfill--done', step > 1);
            }

            function validateStep(stepEl) {
                var valid = true;
                var fields = stepEl.querySelectorAll('input[required], select[required]');
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    f.classList.remove('cr__err');
                    if (!f.value.trim()) {
                        f.classList.add('cr__err');
                        valid = false;
                    }
                }
                var email = stepEl.querySelector('input[type="email"]');
                if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                    email.classList.add('cr__err');
                    valid = false;
                }
                var pw = stepEl.querySelector('input[type="password"]');
                if (pw && pw.value && pw.value.length < 8) {
                    pw.classList.add('cr__err');
                    valid = false;
                }
                return valid;
            }

            // Click delegation for nav buttons.
            form.addEventListener('click', function(e) {
                var btn = e.target.closest('[data-next]');
                if (btn) {
                    e.preventDefault();
                    var stepEl = btn.closest('.cr__step');
                    if (validateStep(stepEl)) {
                        goToStep(parseInt(btn.getAttribute('data-next')));
                    }
                    return;
                }
                var prevBtn = e.target.closest('[data-prev]');
                if (prevBtn) {
                    e.preventDefault();
                    goToStep(parseInt(prevBtn.getAttribute('data-prev')));
                }
            });

            // Clear error on typing.
            form.addEventListener('input', function(e) {
                if (e.target.classList.contains('cr__err')) {
                    e.target.classList.remove('cr__err');
                }
            });

            // WhatsApp toggle.
            var diffWA = document.getElementById('cr_diff_whatsapp');
            var waWrap = document.getElementById('cr-whatsapp-wrap');
            if (diffWA && waWrap) {
                diffWA.addEventListener('change', function() {
                    waWrap.classList.toggle('cr__field--show', this.checked);
                    if (!this.checked) {
                        var waInput = waWrap.querySelector('input');
                        if (waInput) waInput.value = '';
                    }
                });
            }

            // Form submit via AJAX.
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                var stepEl = form.querySelector('.cr__step--active');
                if (!validateStep(stepEl)) return;

                var submitBtn = document.getElementById('cr-submit');
                var errDiv = document.getElementById('cr-error');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account\u2026';
                errDiv.classList.remove('cr__errmsg--visible');

                var data = new FormData(form);
                data.append('action', 'culture_register_user');

                var xhr = new XMLHttpRequest();
                xhr.open('POST', ajaxUrl, true);
                xhr.onload = function() {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        if (resp.success) {
                            if (resp.data && resp.data.redirect) {
                                window.location.href = resp.data.redirect;
                            }
                        } else {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Complete Registration';
                            errDiv.textContent = (resp.data && resp.data.message) || 'Registration failed.';
                            errDiv.classList.add('cr__errmsg--visible');
                        }
                    } catch(ex) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Complete Registration';
                        errDiv.textContent = 'Something went wrong. Please try again.';
                        errDiv.classList.add('cr__errmsg--visible');
                    }
                };
                xhr.onerror = function() {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Complete Registration';
                    errDiv.textContent = 'Network error. Please try again.';
                    errDiv.classList.add('cr__errmsg--visible');
                };
                xhr.send(data);
            });
        })();
        </script>
        <?php
        return ob_get_clean();
    }

    /**
     * Handle the registration AJAX request.
     */
    public static function handle_registration() {
        if ( ! isset( $_POST['culture_register_nonce_field'] )
            || ! wp_verify_nonce( $_POST['culture_register_nonce_field'], 'culture_register_nonce' ) ) {
            wp_send_json_error( array( 'message' => __( 'Security check failed.', 'culture-community' ) ) );
        }

        $username     = isset( $_POST['username'] ) ? sanitize_user( $_POST['username'] ) : '';
        $email        = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';
        $password     = isset( $_POST['password'] ) ? $_POST['password'] : '';
        $display_name = isset( $_POST['display_name'] ) ? sanitize_text_field( $_POST['display_name'] ) : '';
        $phone        = isset( $_POST['phone'] ) ? sanitize_text_field( $_POST['phone'] ) : '';
        $diff_wa      = ! empty( $_POST['diff_whatsapp'] );
        $whatsapp     = ( $diff_wa && isset( $_POST['whatsapp'] ) ) ? sanitize_text_field( $_POST['whatsapp'] ) : '';
        $tier         = isset( $_POST['tier'] ) ? sanitize_key( $_POST['tier'] ) : 'citizen';
        $referral     = isset( $_POST['culture_referral_code'] ) ? sanitize_key( $_POST['culture_referral_code'] ) : '';

        // Validate required fields.
        if ( empty( $username ) || empty( $email ) || empty( $password ) || empty( $phone ) ) {
            wp_send_json_error( array( 'message' => __( 'Please fill in all required fields.', 'culture-community' ) ) );
        }

        if ( strlen( $password ) < 8 ) {
            wp_send_json_error( array( 'message' => __( 'Password must be at least 8 characters.', 'culture-community' ) ) );
        }

        if ( ! in_array( $tier, array( 'citizen', 'patron' ), true ) ) {
            $tier = 'citizen';
        }

        // Create the user.
        $user_id = wp_create_user( $username, $password, $email );
        if ( is_wp_error( $user_id ) ) {
            wp_send_json_error( array( 'message' => $user_id->get_error_message() ) );
        }

        // Set display name.
        wp_update_user( array( 'ID' => $user_id, 'display_name' => $display_name ) );

        // Set membership tier (Patron users start as citizen until payment completes).
        $initial_tier = ( 'patron' === $tier ) ? 'citizen' : 'citizen';
        update_user_meta( $user_id, '_culture_membership_tier', $initial_tier );

        // Save phone number(s).
        if ( $phone ) {
            update_user_meta( $user_id, '_culture_phone', $phone );
        }
        if ( $whatsapp ) {
            update_user_meta( $user_id, '_culture_whatsapp', $whatsapp );
        }

        // Initialize gamification.
        update_user_meta( $user_id, '_culture_points', 0 );
        update_user_meta( $user_id, '_culture_badges', array() );

        // Process referral code if present.
        if ( ! empty( $referral ) ) {
            $_POST['culture_referral_code'] = $referral;
            Culture_Referrals::process_referral( $user_id );
        }

        // Send welcome email once, now that all metadata is in place.
        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_welcome_email( $user_id );
        }

        // Log the user in.
        wp_set_current_user( $user_id );
        wp_set_auth_cookie( $user_id );

        // If Patron tier selected, redirect to Paystack.
        if ( 'patron' === $tier ) {
            wp_send_json_success( array(
                'message'  => __( 'Account created! Redirecting to payment...', 'culture-community' ),
                'redirect' => Culture_Paystack::get_checkout_url( $user_id ),
                'tier'     => 'patron',
            ) );
        }

        wp_send_json_success( array(
            'message'  => __( 'Welcome to the community!', 'culture-community' ),
            'redirect' => home_url( '/' ),
            'tier'     => 'citizen',
        ) );
    }
}
