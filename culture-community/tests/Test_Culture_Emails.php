<?php
/**
 * Tests for Culture_Emails.
 */

use PHPUnit\Framework\TestCase;

class Test_Culture_Emails extends TestCase {

    protected function setUp(): void {
        // Reset stores.
        $GLOBALS['_culture_test_user_meta'] = array();
        $GLOBALS['_culture_test_post_meta'] = array();
        $GLOBALS['_culture_test_posts']     = array();
        $GLOBALS['_culture_test_emails']    = array();
    }

    private function createUser( int $id, string $tier = 'citizen', int $chapter = 0 ): void {
        update_user_meta( $id, '_culture_membership_tier', $tier );
        update_user_meta( $id, '_culture_points', 0 );
        update_user_meta( $id, '_culture_badges', array() );
        if ( $chapter ) {
            update_user_meta( $id, '_culture_primary_chapter_id', $chapter );
        }
    }

    private function createChapter( int $id, string $title ): void {
        $GLOBALS['_culture_test_posts'][ $id ] = (object) array(
            'ID'          => $id,
            'post_type'   => 'culture_chapter',
            'post_status' => 'publish',
            'post_title'  => $title,
        );
    }

    // ── Welcome Email ──

    public function testWelcomeEmailSentOnRegistration(): void {
        $this->createChapter( 100, 'London Chapter' );
        $this->createUser( 1, 'citizen', 100 );

        Culture_Emails::send_welcome_email( 1 );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertEquals( 'user1@test.com', $email['to'] );
        $this->assertStringContainsString( 'Welcome', $email['subject'] );
        $this->assertStringContainsString( 'Test User 1', $email['subject'] );
    }

    public function testWelcomeEmailContainsTierAndChapter(): void {
        $this->createChapter( 100, 'London Chapter' );
        $this->createUser( 1, 'patron', 100 );

        Culture_Emails::send_welcome_email( 1 );

        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( 'Patron', $email['body'] );
        $this->assertStringContainsString( 'London Chapter', $email['body'] );
    }

    public function testWelcomeEmailSkipsInvalidUser(): void {
        // Don't create user meta for user 999.
        Culture_Emails::send_welcome_email( 999 );
        $this->assertCount( 0, $GLOBALS['_culture_test_emails'] );
    }

    // ── Referral Email ──

    public function testReferralConfirmationEmail(): void {
        $this->createUser( 1, 'citizen' );
        $this->createUser( 2, 'citizen' );

        // Give referrer some points and referral count.
        update_user_meta( 1, '_culture_points', 50 );
        update_user_meta( 1, '_culture_referral_count', 2 );

        Culture_Emails::send_referral_confirmation( 1, 2 );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertEquals( 'user1@test.com', $email['to'] );
        $this->assertStringContainsString( 'Test User 2', $email['subject'] );
        $this->assertStringContainsString( 'referral', strtolower( $email['subject'] ) );
    }

    public function testReferralEmailContainsPointsAndCount(): void {
        $this->createUser( 1, 'citizen' );
        $this->createUser( 2, 'citizen' );
        update_user_meta( 1, '_culture_points', 75 );
        update_user_meta( 1, '_culture_referral_count', 3 );

        Culture_Emails::send_referral_confirmation( 1, 2 );

        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( '75', $email['body'] );
        $this->assertStringContainsString( '3', $email['body'] );
    }

    // ── Payment Receipt ──

    public function testPaymentReceiptEmail(): void {
        $this->createUser( 1, 'patron' );

        $tx_data = array(
            'amount'    => 500000, // 5000.00 in kobo
            'currency'  => 'NGN',
            'reference' => 'TXN_REF_12345',
            'plan'      => array( 'name' => 'Patron Monthly' ),
        );

        Culture_Emails::send_payment_receipt( 1, $tx_data );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertEquals( 'user1@test.com', $email['to'] );
        $this->assertStringContainsString( 'Payment', $email['subject'] );
        $this->assertStringContainsString( 'NGN', $email['body'] );
        $this->assertStringContainsString( '5,000.00', $email['body'] );
        $this->assertStringContainsString( 'TXN_REF_12345', $email['body'] );
        $this->assertStringContainsString( 'Patron Monthly', $email['body'] );
    }

    public function testPaymentReceiptHandlesEmptyData(): void {
        $this->createUser( 1, 'patron' );

        Culture_Emails::send_payment_receipt( 1, array() );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( 'Patron', $email['body'] );
    }

    // ── Grace Period Warning ──

    public function testGracePeriodWarningEmail(): void {
        $this->createUser( 1, 'patron' );

        Culture_Emails::send_grace_period_warning( 1 );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertEquals( 'user1@test.com', $email['to'] );
        $this->assertStringContainsString( 'Action Required', $email['subject'] );
        $this->assertStringContainsString( '7 days', $email['body'] );
    }

    // ── Downgrade Notice ──

    public function testDowngradeNoticeEmail(): void {
        $this->createUser( 1, 'citizen' );

        Culture_Emails::send_downgrade_notice( 1 );

        $this->assertCount( 1, $GLOBALS['_culture_test_emails'] );
        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertEquals( 'user1@test.com', $email['to'] );
        $this->assertStringContainsString( 'downgraded', strtolower( $email['subject'] ) );
        $this->assertStringContainsString( 'Citizen', $email['body'] );
    }

    // ── Email Structure ──

    public function testEmailsContainHtmlStructure(): void {
        $this->createUser( 1, 'citizen' );

        Culture_Emails::send_welcome_email( 1 );

        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( '<!DOCTYPE html>', $email['body'] );
        $this->assertStringContainsString( '</html>', $email['body'] );
        $this->assertStringContainsString( 'Content-Type: text/html', $email['headers'][0] );
    }

    public function testEmailsContainCtaButton(): void {
        $this->createUser( 1, 'citizen' );

        Culture_Emails::send_welcome_email( 1 );

        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( 'Explore Now', $email['body'] );
        $this->assertStringContainsString( 'http://example.com', $email['body'] );
    }

    public function testEmailsContainFooter(): void {
        $this->createUser( 1, 'citizen' );

        Culture_Emails::send_welcome_email( 1 );

        $email = $GLOBALS['_culture_test_emails'][0];
        $this->assertStringContainsString( 'Test Site', $email['body'] );
        $this->assertStringContainsString( 'receiving this email', $email['body'] );
    }
}
