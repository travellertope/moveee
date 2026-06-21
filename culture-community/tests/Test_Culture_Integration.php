<?php
/**
 * Integration tests for Paystack webhook handling.
 *
 * Uses mock data stores from bootstrap.php to simulate WordPress
 * without requiring a full installation.
 */

use PHPUnit\Framework\TestCase;

class Test_Culture_Integration extends TestCase {

    protected function setUp(): void {
        // Reset all mock stores.
        $GLOBALS['_culture_test_user_meta']     = array();
        $GLOBALS['_culture_test_post_meta']     = array();
        $GLOBALS['_culture_test_posts']         = array();
        $GLOBALS['_culture_test_attendance']     = array();
        $GLOBALS['_culture_test_attendance_id'] = 0;
    }

    /**
     * Helper: create a mock user with a specific tier.
     */
    private function createUser( int $id, string $tier = 'citizen' ): void {
        update_user_meta( $id, '_culture_membership_tier', $tier );
        update_user_meta( $id, '_culture_points', 0 );
        update_user_meta( $id, '_culture_badges', array() );
    }

    // ── Paystack Webhook Tests ──

    public function test_webhook_subscription_create_upgrades_to_patron() {
        $this->createUser( 10, 'citizen' );
        update_user_meta( 10, '_culture_paystack_customer_code', 'CUS_test123' );

        $data = array(
            'customer'          => array( 'customer_code' => 'CUS_test123' ),
            'subscription_code' => 'SUB_abc456',
        );

        // Call the private method via reflection.
        $method = new ReflectionMethod( Culture_Paystack::class, 'handle_subscription_create' );
        $method->setAccessible( true );
        $method->invoke( null, $data );

        $this->assertEquals( 'patron', get_user_meta( 10, '_culture_membership_tier', true ) );
        $this->assertEquals( 'SUB_abc456', get_user_meta( 10, '_culture_subscription_code', true ) );
        $this->assertEquals( 'active', get_user_meta( 10, '_culture_subscription_status', true ) );
    }

    public function test_webhook_subscription_disable_downgrades_to_citizen() {
        $this->createUser( 11, 'patron' );
        update_user_meta( 11, '_culture_paystack_customer_code', 'CUS_test456' );

        $data = array(
            'customer' => array( 'customer_code' => 'CUS_test456' ),
        );

        $method = new ReflectionMethod( Culture_Paystack::class, 'handle_subscription_disable' );
        $method->setAccessible( true );
        $method->invoke( null, $data );

        $this->assertEquals( 'citizen', get_user_meta( 11, '_culture_membership_tier', true ) );
        $this->assertEquals( 'cancelled', get_user_meta( 11, '_culture_subscription_status', true ) );
    }

    public function test_webhook_payment_failed_sets_grace_period() {
        $this->createUser( 12, 'patron' );
        update_user_meta( 12, '_culture_paystack_customer_code', 'CUS_test789' );

        $data = array(
            'customer' => array( 'customer_code' => 'CUS_test789' ),
        );

        $method = new ReflectionMethod( Culture_Paystack::class, 'handle_payment_failed' );
        $method->setAccessible( true );
        $method->invoke( null, $data );

        // Should NOT downgrade immediately.
        $this->assertEquals( 'patron', get_user_meta( 12, '_culture_membership_tier', true ) );
        // Should set grace period status.
        $this->assertEquals( 'non-renewing', get_user_meta( 12, '_culture_subscription_status', true ) );
        $this->assertNotEmpty( get_user_meta( 12, '_culture_grace_period_start', true ) );
    }

    public function test_webhook_ignores_unknown_customer_code() {
        $data = array(
            'customer' => array( 'customer_code' => 'CUS_nonexistent' ),
        );

        $method = new ReflectionMethod( Culture_Paystack::class, 'handle_subscription_create' );
        $method->setAccessible( true );

        // Should not throw or error.
        $method->invoke( null, $data );
        $this->assertTrue( true ); // No exception = pass.
    }
}
