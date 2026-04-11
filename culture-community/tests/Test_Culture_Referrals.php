<?php
/**
 * Unit tests for the Referral system.
 */

use PHPUnit\Framework\TestCase;

class Test_Culture_Referrals extends TestCase {

    protected function setUp(): void {
        $GLOBALS['_culture_test_user_meta'] = array();
    }

    public function test_generate_referral_code_creates_code() {
        $user_id = 1;

        Culture_Referrals::generate_referral_code( $user_id );

        $code = get_user_meta( $user_id, '_culture_referral_code', true );
        $this->assertNotEmpty( $code, 'Referral code should be generated' );
        $this->assertEquals( 8, strlen( $code ), 'Code should be 8 characters' );
    }

    public function test_generate_referral_code_does_not_overwrite() {
        $user_id = 2;
        update_user_meta( $user_id, '_culture_referral_code', 'existing' );

        Culture_Referrals::generate_referral_code( $user_id );

        $code = get_user_meta( $user_id, '_culture_referral_code', true );
        $this->assertEquals( 'existing', $code, 'Should not overwrite existing code' );
    }

    public function test_get_referral_code_generates_if_missing() {
        $user_id = 3;

        $code = Culture_Referrals::get_referral_code( $user_id );

        $this->assertNotEmpty( $code );
        $this->assertEquals( 8, strlen( $code ) );
    }

    public function test_get_referral_count_default_zero() {
        $this->assertEquals( 0, Culture_Referrals::get_referral_count( 999 ) );
    }

    public function test_get_referral_count_returns_stored_value() {
        $user_id = 4;
        update_user_meta( $user_id, '_culture_referral_count', 7 );

        $this->assertEquals( 7, Culture_Referrals::get_referral_count( $user_id ) );
    }

    public function test_referral_code_uniqueness_across_users() {
        $codes = array();
        for ( $i = 10; $i < 20; $i++ ) {
            Culture_Referrals::generate_referral_code( $i );
            $codes[] = get_user_meta( $i, '_culture_referral_code', true );
        }

        $unique = array_unique( $codes );
        $this->assertCount( count( $codes ), $unique, 'All referral codes should be unique' );
    }

    public function test_generate_sets_referral_count_to_zero() {
        $user_id = 20;

        Culture_Referrals::generate_referral_code( $user_id );

        $count = get_user_meta( $user_id, '_culture_referral_count', true );
        $this->assertEquals( 0, $count );
    }
}
