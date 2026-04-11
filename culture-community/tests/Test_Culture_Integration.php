<?php
/**
 * Integration tests for RSVP flow, membership gate, dual chapter,
 * QR check-in, and Paystack webhook handling.
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

        // Set up a test chapter (post ID 100).
        $GLOBALS['_culture_test_posts'][100] = (object) array(
            'ID'          => 100,
            'post_type'   => 'culture_chapter',
            'post_title'  => 'London Chapter',
            'post_status' => 'publish',
        );

        // Set up a second chapter (post ID 101).
        $GLOBALS['_culture_test_posts'][101] = (object) array(
            'ID'          => 101,
            'post_type'   => 'culture_chapter',
            'post_title'  => 'Tokyo Chapter',
            'post_status' => 'publish',
        );

        // Set up a virtual event (post ID 200).
        $GLOBALS['_culture_test_posts'][200] = (object) array(
            'ID'          => 200,
            'post_type'   => 'culture_event',
            'post_title'  => 'Virtual Meetup',
            'post_status' => 'publish',
        );
        update_post_meta( 200, '_culture_event_date', '2026-06-01T18:00' );
        update_post_meta( 200, '_culture_chapter_id', 100 );
        update_post_meta( 200, '_culture_is_physical', '0' );
        update_post_meta( 200, '_culture_capacity', 50 );

        // Set up a physical event (post ID 201).
        $GLOBALS['_culture_test_posts'][201] = (object) array(
            'ID'          => 201,
            'post_type'   => 'culture_event',
            'post_title'  => 'In-Person Meetup',
            'post_status' => 'publish',
        );
        update_post_meta( 201, '_culture_event_date', '2026-06-15T19:00' );
        update_post_meta( 201, '_culture_chapter_id', 100 );
        update_post_meta( 201, '_culture_is_physical', '1' );
        update_post_meta( 201, '_culture_capacity', 30 );

        // Set up an event in Tokyo chapter (post ID 202).
        $GLOBALS['_culture_test_posts'][202] = (object) array(
            'ID'          => 202,
            'post_type'   => 'culture_event',
            'post_title'  => 'Tokyo Film Night',
            'post_status' => 'publish',
        );
        update_post_meta( 202, '_culture_event_date', '2026-06-20T20:00' );
        update_post_meta( 202, '_culture_chapter_id', 101 );
        update_post_meta( 202, '_culture_is_physical', '0' );
        update_post_meta( 202, '_culture_capacity', 0 );
    }

    /**
     * Helper: create a mock user with specific tier and chapter(s).
     */
    private function createUser( int $id, string $tier = 'citizen', int $primary = 100, int $secondary = 0 ): void {
        update_user_meta( $id, '_culture_membership_tier', $tier );
        update_user_meta( $id, '_culture_primary_chapter_id', $primary );
        update_user_meta( $id, '_culture_points', 0 );
        update_user_meta( $id, '_culture_badges', array() );
        if ( $secondary ) {
            update_user_meta( $id, '_culture_secondary_chapter_id', $secondary );
        }
    }

    /**
     * Helper: create a mock WP_REST_Request.
     */
    private function createRestRequest( array $params ): object {
        return new class( $params ) {
            private $params;
            public function __construct( $params ) { $this->params = $params; }
            public function get_param( $key ) { return $this->params[ $key ] ?? null; }
        };
    }

    // ── Check-in Integration Tests ──

    public function test_checkin_creates_attendance_record() {
        $this->createUser( 1, 'patron', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 1,
            'event_id' => 200,
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertIsArray( $result );
        $this->assertTrue( $result['success'] );
        $this->assertEquals( 'Test User 1', $result['user']['display_name'] );

        // Verify attendance record was created.
        $attendance = $GLOBALS['_culture_test_attendance'];
        $this->assertCount( 1, $attendance );
        $this->assertEquals( 1, $attendance[0]['user_id'] );
        $this->assertEquals( 200, $attendance[0]['event_id'] );
        $this->assertEquals( 'checked_in', $attendance[0]['status'] );
    }

    public function test_checkin_awards_gamification_points() {
        $this->createUser( 2, 'patron', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 2,
            'event_id' => 200,
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertEquals( 15, $result['user']['points'] );
        $this->assertEquals( 15, Culture_Gamification::get_points( 2 ) );
    }

    public function test_checkin_rejects_invalid_user() {
        $request = $this->createRestRequest( array(
            'user_id'  => 999,
            'event_id' => 200,
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertInstanceOf( WP_Error::class, $result );
        $this->assertEquals( 'invalid_user', $result->get_error_code() );
    }

    public function test_checkin_rejects_invalid_event() {
        $this->createUser( 3, 'patron', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 3,
            'event_id' => 999,
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertInstanceOf( WP_Error::class, $result );
        $this->assertEquals( 'invalid_event', $result->get_error_code() );
    }

    // ── Membership Gate Tests ──

    public function test_citizen_blocked_from_physical_event_checkin() {
        $this->createUser( 4, 'citizen', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 4,
            'event_id' => 201, // physical event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertInstanceOf( WP_Error::class, $result );
        $this->assertEquals( 'tier_restricted', $result->get_error_code() );
    }

    public function test_patron_allowed_physical_event_checkin() {
        $this->createUser( 5, 'patron', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 5,
            'event_id' => 201, // physical event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertIsArray( $result );
        $this->assertTrue( $result['success'] );
    }

    public function test_citizen_allowed_virtual_event_checkin() {
        $this->createUser( 6, 'citizen', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 6,
            'event_id' => 200, // virtual event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertIsArray( $result );
        $this->assertTrue( $result['success'] );
    }

    // ── Dual Chapter Tests ──

    public function test_user_blocked_from_wrong_chapter_event() {
        // User in London (100), trying to attend Tokyo (101) event.
        $this->createUser( 7, 'citizen', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 7,
            'event_id' => 202, // Tokyo chapter event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertInstanceOf( WP_Error::class, $result );
        $this->assertEquals( 'wrong_chapter', $result->get_error_code() );
    }

    public function test_patron_with_secondary_chapter_allowed() {
        // Patron in London (100) with secondary Tokyo (101).
        $this->createUser( 8, 'patron', 100, 101 );

        $request = $this->createRestRequest( array(
            'user_id'  => 8,
            'event_id' => 202, // Tokyo chapter event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertIsArray( $result );
        $this->assertTrue( $result['success'] );
    }

    public function test_patron_without_secondary_blocked_from_other_chapter() {
        // Patron in London (100), no secondary.
        $this->createUser( 9, 'patron', 100 );

        $request = $this->createRestRequest( array(
            'user_id'  => 9,
            'event_id' => 202, // Tokyo chapter event
        ) );

        $result = Culture_REST_API::handle_checkin( $request );

        $this->assertInstanceOf( WP_Error::class, $result );
        $this->assertEquals( 'wrong_chapter', $result->get_error_code() );
    }

    // ── Paystack Webhook Tests ──

    public function test_webhook_subscription_create_upgrades_to_patron() {
        $this->createUser( 10, 'citizen', 100 );
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
        $this->createUser( 11, 'patron', 100, 101 );
        update_user_meta( 11, '_culture_paystack_customer_code', 'CUS_test456' );

        $data = array(
            'customer' => array( 'customer_code' => 'CUS_test456' ),
        );

        $method = new ReflectionMethod( Culture_Paystack::class, 'handle_subscription_disable' );
        $method->setAccessible( true );
        $method->invoke( null, $data );

        $this->assertEquals( 'citizen', get_user_meta( 11, '_culture_membership_tier', true ) );
        $this->assertEquals( 'cancelled', get_user_meta( 11, '_culture_subscription_status', true ) );
        // Secondary chapter should be removed on downgrade.
        $this->assertEmpty( get_user_meta( 11, '_culture_secondary_chapter_id', true ) );
    }

    public function test_webhook_payment_failed_sets_grace_period() {
        $this->createUser( 12, 'patron', 100 );
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

    // ── End-to-End Flow Test ──

    public function test_full_checkin_flow_with_gamification() {
        // Create patron user in London.
        $this->createUser( 20, 'patron', 100 );

        // Check into virtual event.
        $request1 = $this->createRestRequest( array( 'user_id' => 20, 'event_id' => 200 ) );
        $result1 = Culture_REST_API::handle_checkin( $request1 );
        $this->assertTrue( $result1['success'] );
        $this->assertEquals( 15, $result1['user']['points'] ); // 15 for check-in

        // Verify attendance stored.
        $this->assertCount( 1, $GLOBALS['_culture_test_attendance'] );

        // Points should persist.
        $this->assertEquals( 15, Culture_Gamification::get_points( 20 ) );
    }
}
