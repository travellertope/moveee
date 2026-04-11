<?php
/**
 * Unit tests for the Gamification system.
 *
 * These tests use the mock environment from bootstrap.php to verify
 * points and badge logic without requiring a full WordPress installation.
 */

use PHPUnit\Framework\TestCase;

class Test_Culture_Gamification extends TestCase {

    protected function setUp(): void {
        // Reset user meta store before each test.
        $GLOBALS['_culture_test_user_meta'] = array();
    }

    public function test_award_points_updates_total() {
        $user_id = 1;

        $total = Culture_Gamification::award_points( $user_id, 'event_checkin' );

        $this->assertEquals( 15, $total, 'event_checkin should award 15 points' );
    }

    public function test_award_points_accumulates() {
        $user_id = 1;

        Culture_Gamification::award_points( $user_id, 'event_checkin' ); // 15
        $total = Culture_Gamification::award_points( $user_id, 'event_rsvp' ); // +5

        $this->assertEquals( 20, $total, 'Points should accumulate across actions' );
    }

    public function test_award_points_custom_value() {
        $user_id = 2;

        $total = Culture_Gamification::award_points( $user_id, 'event_checkin', 50 );

        $this->assertEquals( 50, $total, 'Custom point value should override action default' );
    }

    public function test_award_points_invalid_action_returns_zero() {
        $user_id = 3;

        $total = Culture_Gamification::award_points( $user_id, 'nonexistent_action' );

        $this->assertEquals( 0, $total, 'Invalid action with no custom points should award 0' );
    }

    public function test_get_points_default_zero() {
        $this->assertEquals( 0, Culture_Gamification::get_points( 999 ) );
    }

    public function test_award_badge_success() {
        $user_id = 4;

        $result = Culture_Gamification::award_badge( $user_id, 'first_steps' );

        $this->assertTrue( $result, 'Should return true for new badge' );
        $badges = Culture_Gamification::get_badges( $user_id );
        $this->assertContains( 'first_steps', $badges );
    }

    public function test_award_badge_duplicate_returns_false() {
        $user_id = 5;

        Culture_Gamification::award_badge( $user_id, 'first_steps' );
        $result = Culture_Gamification::award_badge( $user_id, 'first_steps' );

        $this->assertFalse( $result, 'Duplicate badge award should return false' );
    }

    public function test_award_badge_invalid_slug() {
        $user_id = 6;

        $result = Culture_Gamification::award_badge( $user_id, 'nonexistent_badge' );

        $this->assertFalse( $result );
    }

    public function test_get_badges_empty_by_default() {
        $badges = Culture_Gamification::get_badges( 999 );

        $this->assertIsArray( $badges );
        $this->assertEmpty( $badges );
    }

    public function test_get_badges_with_status() {
        $user_id = 7;

        Culture_Gamification::award_badge( $user_id, 'first_steps' );
        $result = Culture_Gamification::get_badges_with_status( $user_id );

        $this->assertTrue( $result['first_steps']['earned'] );
        $this->assertFalse( $result['regular']['earned'] );
        $this->assertFalse( $result['culture_vulture']['earned'] );
    }

    public function test_all_point_actions_defined() {
        $expected = array(
            'event_rsvp',
            'event_checkin',
            'newsletter_comment',
            'newsletter_reaction',
            'referral',
        );

        foreach ( $expected as $action ) {
            $this->assertArrayHasKey( $action, Culture_Gamification::POINTS, "Action '$action' should be defined" );
            $this->assertGreaterThan( 0, Culture_Gamification::POINTS[ $action ] );
        }
    }

    public function test_all_badges_have_required_fields() {
        foreach ( Culture_Gamification::BADGES as $slug => $badge ) {
            $this->assertArrayHasKey( 'name', $badge, "Badge '$slug' missing 'name'" );
            $this->assertArrayHasKey( 'description', $badge, "Badge '$slug' missing 'description'" );
            $this->assertArrayHasKey( 'icon', $badge, "Badge '$slug' missing 'icon'" );
            $this->assertArrayHasKey( 'trigger', $badge, "Badge '$slug' missing 'trigger'" );
            $this->assertArrayHasKey( 'threshold', $badge, "Badge '$slug' missing 'threshold'" );
        }
    }

    public function test_century_club_badge_awarded_at_100_points() {
        $user_id = 8;

        // Award enough points to reach 100.
        Culture_Gamification::award_points( $user_id, 'event_checkin', 100 );

        $badges = Culture_Gamification::get_badges( $user_id );
        $this->assertContains( 'century_club', $badges, 'Century Club badge should be awarded at 100 points' );
    }

    public function test_century_club_badge_not_awarded_below_threshold() {
        $user_id = 9;

        Culture_Gamification::award_points( $user_id, 'event_checkin', 99 );

        $badges = Culture_Gamification::get_badges( $user_id );
        $this->assertNotContains( 'century_club', $badges, 'Century Club badge should not be awarded below 100 points' );
    }
}
