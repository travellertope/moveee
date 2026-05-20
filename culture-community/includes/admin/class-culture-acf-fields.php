<?php
/**
 * Register programmatic ACF fields for the Culture Community plugin.
 * This ensures fields like Location, Admission and Featured Status 
 * are available across all systems without manual configuration.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_ACF_Fields {

    public static function init() {
        // Register field groups when ACF is ready.
        add_action( 'acf/init', array( __CLASS__, 'register_field_groups' ) );
    }

    /**
     * Register ACF Field Groups
     */
    public static function register_field_groups() {
        // Check if ACF is available before registering.
        if ( ! function_exists( 'acf_add_local_field_group' ) ) {
            return;
        }

        // Directory Talent Details
        acf_add_local_field_group( array(
            'key' => 'group_culture_directory_talent',
            'title' => 'Talent / Professional Details',
            'fields' => array(
                array(
                    'key' => 'field_dir_website',
                    'label' => 'Website URL',
                    'name' => 'website_url',
                    'type' => 'url',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_dir_instagram',
                    'label' => 'Instagram Handle',
                    'name' => 'instagram_handle',
                    'type' => 'text',
                    'prepend' => '@',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_dir_twitter',
                    'label' => 'Twitter / X Handle',
                    'name' => 'twitter_handle',
                    'type' => 'text',
                    'prepend' => '@',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_dir_works',
                    'label' => 'Selected Works / Portfolio',
                    'name' => 'selected_works',
                    'type' => 'repeater',
                    'layout' => 'table',
                    'button_label' => 'Add Work',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_work_title',
                            'label' => 'Work Title',
                            'name' => 'title',
                            'type' => 'text',
                        ),
                        array(
                            'key' => 'field_work_image',
                            'label' => 'Image',
                            'name' => 'image',
                            'type' => 'image',
                            'return_format' => 'id',
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'culture_directory',
                    ),
                ),
            ),
        ) );

        // Event Editorial Details
        acf_add_local_field_group( array(
            'key' => 'group_culture_event_details',
            'title' => 'Event Editorial Details',
            'fields' => array(
                array(
                    'key' => 'field_event_host_entry',
                    'label' => 'Featured Host / Artist',
                    'name' => 'featured_host',
                    'type' => 'post_object',
                    'instructions' => 'Link this event to a Talent entry in the Directory.',
                    'post_type' => array( 'culture_directory' ),
                    'allow_null' => 1,
                    'multiple' => 0,
                    'return_format' => 'object',
                    'ui' => 1,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_artist_section_label',
                    'label' => 'Artist Section Label',
                    'name' => 'artist_section_label',
                    'type' => 'text',
                    'instructions' => 'Heading above the artist strip. Defaults to "The artist".',
                    'placeholder' => 'e.g. The curator · The photographer',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_artist_link_label',
                    'label' => 'Artist Profile Link Text',
                    'name' => 'artist_link_label',
                    'type' => 'text',
                    'instructions' => 'CTA link in the artist strip. Defaults to "Read the full portrait".',
                    'placeholder' => 'e.g. View the full profile · Explore the body of work',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_attribution',
                    'label' => 'Attribution / Credit',
                    'name' => 'attribution',
                    'type' => 'text',
                    'instructions' => 'e.g. "Paintings by Ifeoma Okoli" or "Curated by DJ Sose"',
                    'placeholder' => 'By [Name]',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_location',
                    'label' => 'Venue / Location',
                    'name' => 'location',
                    'type' => 'text',
                    'instructions' => 'Specific venue name or location (e.g. "Ikoyi, Lagos")',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_opening_hours',
                    'label' => 'Opening / Gallery Hours',
                    'name' => 'opening_hours',
                    'type' => 'textarea',
                    'instructions' => 'e.g. "Tuesday – Saturday: 11 AM – 6 PM"',
                    'rows' => 2,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_end_date',
                    'label' => 'Event End Date (Optional)',
                    'name' => 'end_date',
                    'type' => 'date_time_picker',
                    'display_format' => 'd/m/Y g:i a',
                    'return_format' => 'Y-m-d H:i:s',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_associated_journey',
                    'label' => 'Accompanying Journey',
                    'name' => 'associated_journey',
                    'type' => 'post_object',
                    'instructions' => 'Link an Origins Journey to this event.',
                    'post_type' => array( 'culture_journey' ),
                    'allow_null' => 1,
                    'multiple' => 0,
                    'return_format' => 'id',
                    'ui' => 1,
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_tagline',
                    'label' => 'Event Pull-Quote / Tagline',
                    'name' => 'tagline',
                    'type' => 'textarea',
                    'rows' => 2,
                ),
                array(
                    'key' => 'field_event_press_group',
                    'label' => 'Press & Media Details',
                    'name' => 'press_details',
                    'type' => 'group',
                    'layout' => 'block',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_press_eyebrow',
                            'label' => 'Section Eyebrow',
                            'name' => 'eyebrow',
                            'type' => 'text',
                            'default_value' => 'Press & Media',
                        ),
                        array(
                            'key' => 'field_press_title',
                            'label' => 'Heading',
                            'name' => 'title',
                            'type' => 'text',
                            'default_value' => 'Press enquiries',
                        ),
                        array(
                            'key' => 'field_press_content',
                            'label' => 'Body Text',
                            'name' => 'content',
                            'type' => 'textarea',
                            'rows' => 3,
                        ),
                        array(
                            'key' => 'field_press_link',
                            'label' => 'Contact Link / Email',
                            'name' => 'link',
                            'type' => 'text',
                            'placeholder' => 'mailto:press@themoveee.com',
                        ),
                    ),
                ),
                array(
                    'key' => 'field_event_is_featured',
                    'label' => 'Spotlight Event',
                    'name' => 'is_featured',
                    'type' => 'true_false',
                    'instructions' => 'Feature this event at the top of the events landing page.',
                    'wrapper' => array( 'width' => '25' ),
                    'message' => 'Show in Spotlight',
                    'ui' => 1,
                ),
                array(
                    'key' => 'field_event_admission',
                    'label' => 'Admission / Ticket Info',
                    'name' => 'admission',
                    'type' => 'text',
                    'instructions' => 'e.g. "Free", "$10", "Member Exclusive"',
                    'default_value' => 'Free',
                    'wrapper' => array( 'width' => '25' ),
                ),
                array(
                    'key' => 'field_event_ticketing_url',
                    'label' => 'External Ticketing URL (Optional)',
                    'name' => 'ticketing_url',
                    'type' => 'url',
                    'instructions' => 'If provided, the RSVP form will be replaced by a "Buy Ticket" button linking here.',
                    'wrapper' => array( 'width' => '50' ),
                ),
                array(
                    'key' => 'field_event_metrics',
                    'label' => 'Key Highlights / Metrics',
                    'name' => 'metrics',
                    'type' => 'repeater',
                    'layout' => 'table',
                    'wrapper' => array( 'width' => '50' ),
                    'button_label' => 'Add Highlight',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_metric_label',
                            'label' => 'Label',
                            'name' => 'label',
                            'type' => 'text',
                            'placeholder' => 'e.g. Paintings',
                        ),
                        array(
                            'key' => 'field_metric_value',
                            'label' => 'Value',
                            'name' => 'value',
                            'type' => 'text',
                            'placeholder' => 'e.g. 25+',
                        ),
                    ),
                ),
                array(
                    'key' => 'field_event_schedule',
                    'label' => 'Managed Program / Schedule',
                    'name' => 'schedule',
                    'type' => 'repeater',
                    'layout' => 'block',
                    'button_label' => 'Add Session',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_session_time',
                            'label' => 'Time / Period',
                            'name' => 'time',
                            'type' => 'text',
                            'placeholder' => 'e.g. 18:00 or Sat 11 April',
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_session_title',
                            'label' => 'Session Title',
                            'name' => 'title',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '40' ),
                        ),
                        array(
                            'key' => 'field_session_access',
                            'label' => 'Access Level',
                            'name' => 'access',
                            'type' => 'select',
                            'choices' => array(
                                'public' => 'Public Access',
                                'member' => 'Members Only',
                                'patron' => 'Patron Only',
                            ),
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_session_desc',
                            'label' => 'Brief Description',
                            'name' => 'description',
                            'type' => 'textarea',
                            'rows' => 2,
                        ),
                    ),
                ),
                array(
                    'key' => 'field_showcase_label',
                    'label' => 'Showcase Section Title',
                    'name' => 'showcase_label',
                    'type' => 'text',
                    'placeholder' => 'e.g. Selected Works · Leave blank for default',
                    'instructions' => 'Custom heading for the works/gallery section. Defaults to "Selected works" if left blank.',
                ),
                array(
                    'key' => 'field_event_showcase',
                    'label' => 'Showcase Items (Works / Gallery)',
                    'name' => 'showcase',
                    'type' => 'repeater',
                    'layout' => 'block',
                    'button_label' => 'Add Showcase Item',
                    'sub_fields' => array(
                        array(
                            'key' => 'field_showcase_image',
                            'label' => 'Image',
                            'name' => 'image',
                            'type' => 'image',
                            'return_format' => 'array',
                            'wrapper' => array( 'width' => '30' ),
                        ),
                        array(
                            'key' => 'field_showcase_title',
                            'label' => 'Title',
                            'name' => 'title',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '70' ),
                        ),
                        array(
                            'key' => 'field_showcase_media',
                            'label' => 'Media / Type',
                            'name' => 'media',
                            'type' => 'text',
                            'placeholder' => 'e.g. Oil on Canvas',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_dimensions',
                            'label' => 'Dimensions',
                            'name' => 'dimensions',
                            'type' => 'text',
                            'placeholder' => 'e.g. 90x120cm',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_year',
                            'label' => 'Year',
                            'name' => 'year',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                        array(
                            'key' => 'field_showcase_price',
                            'label' => 'Price / SKU',
                            'name' => 'price',
                            'type' => 'text',
                            'wrapper' => array( 'width' => '25' ),
                        ),
                    ),
                ),
            // ── Display & RSVP fields ────────────────────────────────────
            array(
                'key'           => 'field_event_subtype',
                'label'         => 'Event Type / Subtype',
                'name'          => 'event_subtype',
                'type'          => 'select',
                'instructions'  => 'Shown in the hero eyebrow (e.g. "Opening Night", "Talk").',
                'choices'       => array(
                    'Opening Night'    => 'Opening Night',
                    'Exhibition'       => 'Exhibition',
                    'Talk'             => 'Talk',
                    'Panel Discussion' => 'Panel Discussion',
                    'Screening'        => 'Screening',
                    'Performance'      => 'Performance',
                    'Live Music'       => 'Live Music',
                    'Workshop'         => 'Workshop',
                    'Pop-Up'           => 'Pop-Up',
                    'Market'           => 'Market',
                    'Dinner'           => 'Dinner',
                    'Private View'     => 'Private View',
                    'Showcase'         => 'Showcase',
                    'Other'            => 'Other',
                ),
                'default_value' => '',
                'allow_null'    => 1,
                'wrapper'       => array( 'width' => '50' ),
            ),
            array(
                'key'          => 'field_event_about_label',
                'label'        => 'About Section Label',
                'name'         => 'about_label',
                'type'         => 'text',
                'instructions' => 'Heading for the main description (e.g. "About the event", "The concept", "About the exhibition").',
                'placeholder'  => 'About the event',
                'wrapper'      => array( 'width' => '50' ),
            ),
            array(
                'key'          => 'field_event_venue_address',
                'label'        => 'Venue Full Address',
                'name'         => 'venue_address',
                'type'         => 'textarea',
                'instructions' => 'Full address shown in the venue card on the event page.',
                'rows'         => 3,
                'wrapper'      => array( 'width' => '50' ),
            ),
            array(
                'key'          => 'field_event_rsvp_capacity',
                'label'        => 'RSVP Capacity (total spots)',
                'name'         => 'rsvp_capacity',
                'type'         => 'number',
                'instructions' => 'Leave 0 or blank for unlimited.',
                'min'          => 0,
                'wrapper'      => array( 'width' => '25' ),
            ),
            array(
                'key'           => 'field_event_rsvp_members_note',
                'label'         => 'RSVP Members Note',
                'name'          => 'rsvp_members_note',
                'type'          => 'text',
                'instructions'  => 'Short note above the RSVP form for Connect members.',
                'default_value' => '★ Connect members: log in to unlock Private View access',
                'wrapper'       => array( 'width' => '75' ),
            ),
            array(
                'key'          => 'field_event_rsvp_ticket_types',
                'label'        => 'RSVP Ticket Types',
                'name'         => 'rsvp_ticket_types',
                'type'         => 'repeater',
                'layout'       => 'table',
                'button_label' => 'Add Ticket Type',
                'instructions' => 'Define available ticket types. Leave Price blank for free.',
                'sub_fields'   => array(
                    array(
                        'key'         => 'field_ticket_name',
                        'label'       => 'Name',
                        'name'        => 'ticket_name',
                        'type'        => 'text',
                        'placeholder' => 'e.g. General Admission',
                        'wrapper'     => array( 'width' => '35' ),
                    ),
                    array(
                        'key'          => 'field_ticket_slug',
                        'label'        => 'Slug (form value)',
                        'name'         => 'ticket_slug',
                        'type'         => 'text',
                        'placeholder'  => 'e.g. general',
                        'instructions' => 'Short key sent with RSVP (no spaces).',
                        'wrapper'      => array( 'width' => '20' ),
                    ),
                    array(
                        'key'         => 'field_ticket_info',
                        'label'       => 'Info / Subtitle',
                        'name'        => 'ticket_info',
                        'type'        => 'text',
                        'placeholder' => 'e.g. 19:30 entry · open to all',
                        'wrapper'     => array( 'width' => '30' ),
                    ),
                    array(
                        'key'         => 'field_ticket_price',
                        'label'       => 'Price (blank = Free)',
                        'name'        => 'ticket_price',
                        'type'        => 'text',
                        'placeholder' => 'e.g. ₦5,000',
                        'wrapper'     => array( 'width' => '15' ),
                    ),
                    array(
                        'key'          => 'field_ticket_amount',
                        'label'        => 'Price Amount (numeric)',
                        'name'         => 'ticket_amount',
                        'type'         => 'number',
                        'min'          => 0,
                        'step'         => 1,
                        'placeholder'  => 'e.g. 5000',
                        'instructions' => 'Face value in major units (e.g. 5000 for ₦5,000). Leave 0 for free.',
                        'wrapper'      => array( 'width' => '15' ),
                    ),
                    array(
                        'key'           => 'field_ticket_currency',
                        'label'         => 'Currency',
                        'name'          => 'ticket_currency',
                        'type'          => 'select',
                        'choices'       => array(
                            'NGN' => 'NGN (₦ Naira)',
                            'USD' => 'USD ($ Dollar)',
                            'GBP' => 'GBP (£ Pound)',
                            'EUR' => 'EUR (€ Euro)',
                        ),
                        'default_value' => 'NGN',
                        'wrapper'       => array( 'width' => '10' ),
                    ),
                ),
            ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'culture_event',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => '',
            'show_in_graphql' => true,
        ) );

        // Journey Meta Fields Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_meta',
            'title'    => 'Journey Details',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_edition',
                    'label'             => 'Edition',
                    'name'              => 'journey_edition',
                    'type'              => 'text',
                    'instructions'      => 'e.g., N°04, Lagos Edition',
                    'placeholder'       => 'N°04',
                    'maxlength'         => 100,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_dates',
                    'label'             => 'Journey Dates',
                    'name'              => 'journey_dates',
                    'type'              => 'text',
                    'instructions'      => 'e.g., 19–23 April 2026',
                    'placeholder'       => '19–23 April 2026',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_location',
                    'label'             => 'Location',
                    'name'              => 'journey_location',
                    'type'              => 'text',
                    'instructions'      => 'City or destination',
                    'placeholder'       => 'Lagos, Nigeria',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_price',
                    'label'             => 'Price',
                    'name'              => 'journey_price',
                    'type'              => 'text',
                    'instructions'      => 'e.g., $4,200 USD',
                    'placeholder'       => '$4,200 USD',
                    'maxlength'         => 150,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_spots',
                    'label'             => 'Available Spots',
                    'name'              => 'journey_spots',
                    'type'              => 'text',
                    'instructions'      => 'Number of remaining spots',
                    'placeholder'       => '7',
                    'maxlength'         => 20,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_status',
                    'label'             => 'Status',
                    'name'              => 'journey_status',
                    'type'              => 'select',
                    'instructions'      => 'Current status of the journey',
                    'choices'           => array(
                        'active'        => 'Active (Currently Booking)',
                        'upcoming'      => 'Upcoming (Not Yet Open)',
                        'completed'     => 'Completed (Sold Out/Past)',
                    ),
                    'default_value'     => 'upcoming',
                    'allow_null'        => 0,
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_inclusions',
                    'label'             => 'What\'s Included',
                    'name'              => 'journey_inclusions',
                    'type'              => 'textarea',
                    'instructions'      => 'Included items/services (optional)',
                    'placeholder'       => 'Accommodation, meals, guided experiences...',
                    'show_in_graphql'   => 1,
                ),
                array(
                    'key'               => 'field_journey_exclusions',
                    'label'             => 'What\'s Not Included',
                    'name'              => 'journey_exclusions',
                    'type'              => 'textarea',
                    'instructions'      => 'Not included items (optional)',
                    'placeholder'       => 'International flights, travel insurance...',
                    'show_in_graphql'   => 1,
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 0,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );

        // Journey Itinerary Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_itinerary',
            'title'    => 'Itinerary',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_itinerary',
                    'label'             => 'Days',
                    'name'              => 'journey_itinerary',
                    'type'              => 'repeater',
                    'instructions'      => 'Add each day of the journey',
                    'min'               => 0,
                    'max'               => '',
                    'layout'            => 'block',
                    'button_label'      => 'Add Day',
                    'show_in_graphql'   => 1,
                    'sub_fields'        => array(
                        array(
                            'key'               => 'field_day_number',
                            'label'             => 'Day Number',
                            'name'              => 'day_number',
                            'type'              => 'text',
                            'placeholder'       => '1',
                            'maxlength'         => 10,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_title',
                            'label'             => 'Title',
                            'name'              => 'day_title',
                            'type'              => 'text',
                            'placeholder'       => 'Market at Dawn',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_location',
                            'label'             => 'Location',
                            'name'              => 'day_location',
                            'type'              => 'text',
                            'placeholder'       => 'Lekki Arts District',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_description',
                            'label'             => 'Description',
                            'name'              => 'day_description',
                            'type'              => 'textarea',
                            'placeholder'       => 'What happens on this day...',
                            'rows'              => 3,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_day_activities',
                            'label'             => 'Activities',
                            'name'              => 'activities',
                            'type'              => 'repeater',
                            'min'               => 0,
                            'max'               => '',
                            'layout'            => 'table',
                            'button_label'      => 'Add Activity',
                            'show_in_graphql'   => 1,
                            'sub_fields'        => array(
                                array(
                                    'key'               => 'field_activity_time',
                                    'label'             => 'Time',
                                    'name'              => 'activity_time',
                                    'type'              => 'text',
                                    'placeholder'       => '09:00',
                                    'maxlength'         => 20,
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_title',
                                    'label'             => 'Title',
                                    'name'              => 'activity_title',
                                    'type'              => 'text',
                                    'placeholder'       => 'Studio visit with artist',
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_description',
                                    'label'             => 'Description',
                                    'name'              => 'activity_description',
                                    'type'              => 'textarea',
                                    'placeholder'       => 'What we\'ll do...',
                                    'rows'              => 2,
                                    'show_in_graphql'   => 1,
                                ),
                                array(
                                    'key'               => 'field_activity_type',
                                    'label'             => 'Type',
                                    'name'              => 'activity_type',
                                    'type'              => 'select',
                                    'choices'           => array(
                                        'anchor'    => 'Cultural Anchor',
                                        'include'   => 'Included',
                                        'members'   => 'Members Only',
                                    ),
                                    'allow_null'        => 1,
                                    'show_in_graphql'   => 1,
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 1,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );

        // ── Directory Infobox Field Groups (per entry type) ──────────────────

        // Helper: shared ACF location rules factory
        $dir_type_location = function( $type_slug ) {
            return array(
                array(
                    array( 'param' => 'post_type',     'operator' => '==', 'value' => 'culture_directory' ),
                    array( 'param' => 'post_taxonomy', 'operator' => '==', 'value' => 'culture_dir_type:' . $type_slug ),
                ),
            );
        };

        // ── Person ────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_person',
            'title'    => 'Person — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_person_born',         'label' => 'Born',                 'name' => 'dir_infobox_born',         'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_person_died',         'label' => 'Died',                 'name' => 'dir_infobox_died',         'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_person_nationality',  'label' => 'Nationality',          'name' => 'dir_infobox_nationality',  'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_person_occupation',   'label' => 'Occupation',           'name' => 'dir_infobox_occupation',   'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_known_for',    'label' => 'Known For',            'name' => 'dir_infobox_known_for',    'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_origin_city',  'label' => 'Origin / City',        'name' => 'dir_infobox_origin_city',  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_active_years', 'label' => 'Active Years',         'name' => 'dir_infobox_active_years', 'type' => 'text', 'placeholder' => 'e.g. 1971–2015', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_labels',       'label' => 'Labels / Affiliations','name' => 'dir_infobox_labels',       'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_education',    'label' => 'Education',            'name' => 'dir_infobox_education',    'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_person_awards',       'label' => 'Notable Awards',       'name' => 'dir_infobox_awards',       'type' => 'textarea', 'rows' => 2, 'instructions' => 'Comma-separated list of awards' ),
            ),
            'location'   => $dir_type_location( 'person' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Place ─────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_place',
            'title'    => 'Place — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_place_country',   'label' => 'Country',           'name' => 'dir_infobox_country',           'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_place_region',    'label' => 'Region / State',    'name' => 'dir_infobox_region',            'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_place_pop',       'label' => 'Population',        'name' => 'dir_infobox_population',        'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_place_lang',      'label' => 'Official Language', 'name' => 'dir_infobox_official_language', 'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_place_currency',  'label' => 'Currency',          'name' => 'dir_infobox_currency',          'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_place_founded',   'label' => 'Founded / Est.',    'name' => 'dir_infobox_founded',           'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_place_area',      'label' => 'Area',              'name' => 'dir_infobox_area',              'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
            ),
            'location'   => $dir_type_location( 'place' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Movement ──────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_movement',
            'title'    => 'Movement — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_mvt_founded',      'label' => 'Founded',            'name' => 'dir_infobox_founded',           'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_mvt_founders',     'label' => 'Founders',           'name' => 'dir_infobox_founders',          'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_mvt_origin',       'label' => 'Origin Country',     'name' => 'dir_infobox_origin_country',    'type' => 'text', 'wrapper' => array( 'width' => '33' ) ),
                array( 'key' => 'field_dir_ib_mvt_period',       'label' => 'Active Period',      'name' => 'dir_infobox_active_period',     'type' => 'text', 'placeholder' => 'e.g. 1950s–present', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_mvt_ideology',     'label' => 'Ideology / Core Ideas', 'name' => 'dir_infobox_ideology',       'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_mvt_key_figures',  'label' => 'Key Figures',        'name' => 'dir_infobox_key_figures',       'type' => 'textarea', 'rows' => 2 ),
                array( 'key' => 'field_dir_ib_mvt_related',      'label' => 'Related Movements',  'name' => 'dir_infobox_related_movements', 'type' => 'text' ),
            ),
            'location'   => $dir_type_location( 'movement' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Genre ─────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_genre',
            'title'    => 'Genre — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_genre_origin_country', 'label' => 'Origin Country',  'name' => 'dir_infobox_origin_country', 'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_genre_decade',         'label' => 'Origin Decade',   'name' => 'dir_infobox_origin_decade',  'type' => 'text', 'placeholder' => 'e.g. 1990s', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_genre_instruments',    'label' => 'Key Instruments', 'name' => 'dir_infobox_instruments',    'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_genre_tempo',          'label' => 'Tempo (BPM)',     'name' => 'dir_infobox_tempo_bpm',      'type' => 'text', 'placeholder' => 'e.g. 100–120 BPM', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_genre_key_artists',    'label' => 'Key Artists',     'name' => 'dir_infobox_key_artists',    'type' => 'textarea', 'rows' => 2 ),
                array( 'key' => 'field_dir_ib_genre_related',        'label' => 'Related Genres',  'name' => 'dir_infobox_related_genres', 'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_genre_subgenres',      'label' => 'Subgenres',       'name' => 'dir_infobox_subgenres',      'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
            ),
            'location'   => $dir_type_location( 'genre' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Concept ───────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_concept',
            'title'    => 'Concept — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_con_origin',    'label' => 'Origin Country',    'name' => 'dir_infobox_origin_country',  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_con_period',    'label' => 'Period / Era',       'name' => 'dir_infobox_period',          'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_con_known_for', 'label' => 'Known For',          'name' => 'dir_infobox_known_for',       'type' => 'text', 'wrapper' => array( 'width' => '100' ) ),
                array( 'key' => 'field_dir_ib_con_thinkers',  'label' => 'Key Thinkers',       'name' => 'dir_infobox_key_thinkers',    'type' => 'textarea', 'rows' => 2 ),
                array( 'key' => 'field_dir_ib_con_related',   'label' => 'Related Concepts',   'name' => 'dir_infobox_related_concepts','type' => 'text' ),
            ),
            'location'   => $dir_type_location( 'concept' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Film ──────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_film',
            'title'    => 'Film — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_film_director',    'label' => 'Director',            'name' => 'dir_infobox_director',          'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_film_year',        'label' => 'Year',                'name' => 'dir_infobox_year',              'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_film_runtime',     'label' => 'Runtime',             'name' => 'dir_infobox_runtime',           'type' => 'text', 'placeholder' => 'e.g. 94 min', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_film_country',     'label' => 'Country',             'name' => 'dir_infobox_country',           'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_film_language',    'label' => 'Language',            'name' => 'dir_infobox_language',          'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_film_distributor', 'label' => 'Distributor',         'name' => 'dir_infobox_distributor',       'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_film_prod_co',     'label' => 'Production Company',  'name' => 'dir_infobox_production_company','type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_film_cinemato',    'label' => 'Cinematographer',     'name' => 'dir_infobox_cinematographer',   'type' => 'text', 'wrapper' => array( 'width' => '100' ) ),
                array( 'key' => 'field_dir_ib_film_starring',    'label' => 'Starring',            'name' => 'dir_infobox_starring',          'type' => 'textarea', 'rows' => 2 ),
            ),
            'location'   => $dir_type_location( 'film' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Book ──────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_book',
            'title'    => 'Book — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_book_author',    'label' => 'Author',          'name' => 'dir_infobox_author',        'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_book_year',      'label' => 'Year Published',  'name' => 'dir_infobox_year_published', 'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_book_pages',     'label' => 'Pages',           'name' => 'dir_infobox_pages',         'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_book_genre',     'label' => 'Genre',           'name' => 'dir_infobox_genre',         'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_book_publisher', 'label' => 'Publisher',       'name' => 'dir_infobox_publisher',     'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_book_language',  'label' => 'Language',        'name' => 'dir_infobox_language',      'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_book_isbn',      'label' => 'ISBN',            'name' => 'dir_infobox_isbn',          'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
            ),
            'location'   => $dir_type_location( 'book' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Artwork ───────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_artwork',
            'title'    => 'Artwork — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_art_artist',     'label' => 'Artist',           'name' => 'dir_infobox_artist',          'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_art_year',       'label' => 'Year',             'name' => 'dir_infobox_year',            'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_art_medium',     'label' => 'Medium',           'name' => 'dir_infobox_medium',          'type' => 'text', 'placeholder' => 'e.g. Oil on canvas', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_art_dimensions', 'label' => 'Dimensions',       'name' => 'dir_infobox_dimensions',      'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_art_style',      'label' => 'Style / Movement', 'name' => 'dir_infobox_style',           'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_art_location',   'label' => 'Current Location', 'name' => 'dir_infobox_current_location','type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_art_collection', 'label' => 'Collection',       'name' => 'dir_infobox_art_collection',  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
            ),
            'location'   => $dir_type_location( 'artwork' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Food ──────────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_food',
            'title'    => 'Food & Drink — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_food_origin',       'label' => 'Origin Country',      'name' => 'dir_infobox_origin_country',  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_food_type',         'label' => 'Food Type',           'name' => 'dir_infobox_food_type',        'type' => 'text', 'placeholder' => 'e.g. Main dish, Snack, Drink', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_food_also_known',   'label' => 'Also Known As',       'name' => 'dir_infobox_also_known_as',    'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_food_context',      'label' => 'Cultural Context',    'name' => 'dir_infobox_cultural_context', 'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_food_ingredients',  'label' => 'Main Ingredients',    'name' => 'dir_infobox_main_ingredients', 'type' => 'textarea', 'rows' => 2 ),
            ),
            'location'   => $dir_type_location( 'food' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── Fashion ───────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_fashion',
            'title'    => 'Fashion — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_fash_origin',      'label' => 'Origin / Region',      'name' => 'dir_infobox_origin',                  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_fash_era',         'label' => 'Era / Period',         'name' => 'dir_infobox_era',                     'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_fash_style',       'label' => 'Style / Category',    'name' => 'dir_infobox_style',                   'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_fash_materials',   'label' => 'Materials / Fabric',   'name' => 'dir_infobox_materials',               'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_fash_designers',   'label' => 'Key Designers',        'name' => 'dir_infobox_key_designers',           'type' => 'textarea', 'rows' => 2 ),
                array( 'key' => 'field_dir_ib_fash_significance','label' => 'Cultural Significance','name' => 'dir_infobox_cultural_significance',   'type' => 'textarea', 'rows' => 2 ),
            ),
            'location'   => $dir_type_location( 'fashion' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // ── TV Series ─────────────────────────────────────────────────────────
        acf_add_local_field_group( array(
            'key'      => 'group_dir_infobox_tv_series',
            'title'    => 'TV Series — Infobox Details',
            'fields'   => array(
                array( 'key' => 'field_dir_ib_tv_creator',  'label' => 'Created By',    'name' => 'dir_infobox_creator',  'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_tv_network',  'label' => 'Network / Platform', 'name' => 'dir_infobox_network', 'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_tv_seasons',  'label' => 'Seasons',       'name' => 'dir_infobox_seasons',  'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_tv_years',    'label' => 'Years',         'name' => 'dir_infobox_years',    'type' => 'text', 'placeholder' => 'e.g. 2019–2023', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_tv_country',  'label' => 'Country',       'name' => 'dir_infobox_country',  'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_tv_language', 'label' => 'Language',      'name' => 'dir_infobox_language', 'type' => 'text', 'wrapper' => array( 'width' => '25' ) ),
                array( 'key' => 'field_dir_ib_tv_genre',    'label' => 'Genre',         'name' => 'dir_infobox_genre',    'type' => 'text', 'wrapper' => array( 'width' => '50' ) ),
                array( 'key' => 'field_dir_ib_tv_starring', 'label' => 'Starring',      'name' => 'dir_infobox_starring', 'type' => 'textarea', 'rows' => 2 ),
            ),
            'location'   => $dir_type_location( 'tv-series' ),
            'menu_order' => 5,
            'position'   => 'normal',
        ) );

        // Journey Hosts Group
        acf_add_local_field_group( array(
            'key'      => 'group_journey_hosts',
            'title'    => 'Hosts',
            'fields'   => array(
                array(
                    'key'               => 'field_journey_hosts',
                    'label'             => 'Hosts',
                    'name'              => 'journey_hosts',
                    'type'              => 'repeater',
                    'instructions'      => 'Add resident hosts/guides for this journey',
                    'min'               => 0,
                    'max'               => '',
                    'layout'            => 'block',
                    'button_label'      => 'Add Host',
                    'show_in_graphql'   => 1,
                    'sub_fields'        => array(
                        array(
                            'key'               => 'field_host_name',
                            'label'             => 'Name',
                            'name'              => 'host_name',
                            'type'              => 'text',
                            'placeholder'       => 'Full name',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_role',
                            'label'             => 'Role',
                            'name'              => 'host_role',
                            'type'              => 'text',
                            'placeholder'       => 'Curator, Artist, Musician',
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_bio',
                            'label'             => 'Biography',
                            'name'              => 'host_bio',
                            'type'              => 'textarea',
                            'placeholder'       => 'Who they are and what they do...',
                            'rows'              => 3,
                            'show_in_graphql'   => 1,
                        ),
                        array(
                            'key'               => 'field_host_image',
                            'label'             => 'Image',
                            'name'              => 'host_image',
                            'type'              => 'image',
                            'return_format'     => 'id',
                            'preview_size'      => 'thumbnail',
                            'library'           => 'all',
                            'show_in_graphql'   => 1,
                        ),
                    ),
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param'    => 'post_type',
                        'operator' => '==',
                        'value'    => 'culture_journey',
                    ),
                ),
            ),
            'menu_order'        => 2,
            'position'          => 'normal',
            'style'             => 'default',
            'label_placement'   => 'top',
            'instruction_placement' => 'label',
            'show_in_graphql'   => 1,
        ) );

        // ── Connect Directory — User Profile ─────────────────────────────────────
        if ( function_exists( 'acf_add_local_field_group' ) ) {
            acf_add_local_field_group( array(
                'key'    => 'group_connect_directory_user',
                'title'  => 'Moveee Connect — Directory Profile',
                'fields' => array(
                    array(
                        'key'           => 'field_connect_dir_opt_in',
                        'label'         => 'Show in Connect Directory',
                        'name'          => '_culture_directory_opt_in',
                        'type'          => 'true_false',
                        'instructions'  => 'When enabled, this member appears in the public Connect member directory.',
                        'message'       => 'List me in the directory',
                        'default_value' => 1,
                        'ui'            => 1,
                        'wrapper'       => array( 'width' => '100' ),
                    ),
                    array(
                        'key'           => 'field_connect_dir_bio',
                        'label'         => 'Directory Bio',
                        'name'          => '_culture_directory_bio',
                        'type'          => 'textarea',
                        'instructions'  => 'Short bio shown on the member card (max 160 characters).',
                        'maxlength'     => 160,
                        'rows'          => 3,
                        'wrapper'       => array( 'width' => '100' ),
                    ),
                    array(
                        'key'           => 'field_connect_dir_disciplines',
                        'label'         => 'Disciplines',
                        'name'          => '_culture_directory_disciplines',
                        'type'          => 'checkbox',
                        'instructions'  => 'Select all that apply. Stored as comma-separated string.',
                        'choices'       => array(
                            'Creative'      => 'Creative',
                            'Entrepreneur'  => 'Entrepreneur',
                            'Artist'        => 'Artist',
                            'Filmmaker'     => 'Filmmaker',
                            'Writer'        => 'Writer',
                            'Designer'      => 'Designer',
                            'Musician'      => 'Musician',
                            'Photographer'  => 'Photographer',
                            'Tech'          => 'Tech',
                            'Legal'         => 'Legal',
                            'Finance'       => 'Finance',
                            'Academic'      => 'Academic',
                        ),
                        'layout'        => 'horizontal',
                        'return_format' => 'value',
                        'save_custom'   => 0,
                        'wrapper'       => array( 'width' => '100' ),
                    ),
                    array(
                        'key'         => 'field_connect_dir_instagram',
                        'label'       => 'Instagram Handle',
                        'name'        => '_culture_directory_instagram',
                        'type'        => 'text',
                        'prepend'     => '@',
                        'instructions'=> 'Without the @ symbol.',
                        'wrapper'     => array( 'width' => '33' ),
                    ),
                    array(
                        'key'     => 'field_connect_dir_linkedin',
                        'label'   => 'LinkedIn URL',
                        'name'    => '_culture_directory_linkedin',
                        'type'    => 'url',
                        'wrapper' => array( 'width' => '33' ),
                    ),
                    array(
                        'key'     => 'field_connect_dir_website',
                        'label'   => 'Website',
                        'name'    => '_culture_directory_website',
                        'type'    => 'url',
                        'wrapper' => array( 'width' => '33' ),
                    ),
                ),
                'location' => array(
                    array(
                        array(
                            'param'    => 'user_form',
                            'operator' => '==',
                            'value'    => 'all',
                        ),
                    ),
                ),
                'menu_order'            => 10,
                'position'              => 'normal',
                'style'                 => 'default',
                'label_placement'       => 'top',
                'instruction_placement' => 'label',
                'active'                => true,
                'description'           => 'Controls what appears on the member\'s Connect Directory card.',
            ) );
        }

        // Serialize disciplines as comma-separated string for REST API compatibility
        add_filter( 'acf/update_value/key=field_connect_dir_disciplines', function( $value, $post_id, $field ) {
            if ( is_array( $value ) ) {
                $value = implode( ',', array_map( 'sanitize_text_field', $value ) );
            }
            return $value;
        }, 10, 3 );

        // On load, convert back to array for ACF checkbox rendering
        add_filter( 'acf/load_value/key=field_connect_dir_disciplines', function( $value, $post_id, $field ) {
            if ( is_string( $value ) && strpos( $value, ',' ) !== false ) {
                $value = array_map( 'trim', explode( ',', $value ) );
            }
            return $value;
        }, 10, 3 );

    }
}
