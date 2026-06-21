/**
 * Culture Theme — Customizer live preview.
 */
(function( $ ) {
    'use strict';

    /* ── Helper: inject / update a <style> block ── */
    function injectStyle( id, css ) {
        var el = document.getElementById( id );
        if ( ! el ) {
            el = document.createElement( 'style' );
            el.id = id;
            document.head.appendChild( el );
        }
        el.textContent = css;
    }

    function hexToRgba( hex, a ) {
        hex = hex.replace( '#', '' );
        if ( hex.length === 3 ) {
            hex = hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
        }
        var r = parseInt( hex.substring(0,2), 16 );
        var g = parseInt( hex.substring(2,4), 16 );
        var b = parseInt( hex.substring(4,6), 16 );
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    /* ═══════════════════════════════════
       Global Colours
       ═══════════════════════════════════ */

    wp.customize( 'culture_primary_color', function( value ) {
        value.bind( function( to ) {
            document.documentElement.style.setProperty( '--ct-primary', to );
        } );
    } );

    wp.customize( 'culture_accent_color', function( value ) {
        value.bind( function( to ) {
            document.documentElement.style.setProperty( '--ct-accent', to );
        } );
    } );

    /* ═══════════════════════════════════
       Logo Height
       ═══════════════════════════════════ */

    wp.customize( 'culture_logo_height_desktop', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-logo-desktop-preview',
                '.ct-header__brand img { height: ' + parseInt( to, 10 ) + 'px; width: auto; }' );
        } );
    } );

    wp.customize( 'culture_logo_height_mobile', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-logo-mobile-preview',
                '@media (max-width: 768px) { .ct-header__brand img { height: ' + parseInt( to, 10 ) + 'px; width: auto; } }' );
        } );
    } );

    /* ═══════════════════════════════════
       Hero Section — Texts
       ═══════════════════════════════════ */

    wp.customize( 'culture_hero_heading', function( value ) {
        value.bind( function( to ) {
            $( '.ct-hero__heading' ).text( to );
        } );
    } );

    wp.customize( 'culture_hero_subheading', function( value ) {
        value.bind( function( to ) {
            $( '.ct-hero__sub' ).text( to );
        } );
    } );

    wp.customize( 'culture_hero_cta_text', function( value ) {
        value.bind( function( to ) {
            $( '.ct-hero .ct-btn--accent' ).text( to );
        } );
    } );

    /* ═══════════════════════════════════
       Hero Section — Background Colours
       ═══════════════════════════════════ */

    wp.customize( 'culture_hero_bg_color', function( value ) {
        value.bind( function( to ) {
            if ( wp.customize( 'culture_hero_bg_type' ).get() === 'solid' ) {
                injectStyle( 'ct-hero-bg-preview', '.ct-hero { background: ' + to + '; }' );
            }
        } );
    } );

    // Gradient live preview (start, end, angle).
    function updateHeroGradient() {
        if ( wp.customize( 'culture_hero_bg_type' ).get() !== 'gradient' ) return;
        var s = wp.customize( 'culture_hero_gradient_start' ).get() || '#2c3e50';
        var e = wp.customize( 'culture_hero_gradient_end' ).get() || '#1a252f';
        var a = parseInt( wp.customize( 'culture_hero_gradient_angle' ).get(), 10 ) || 135;
        injectStyle( 'ct-hero-bg-preview',
            '.ct-hero { background: linear-gradient(' + a + 'deg, ' + s + ', ' + e + '); }' +
            '.ct-hero::before { background: none; }' );
    }

    wp.customize( 'culture_hero_gradient_start', function( v ) { v.bind( updateHeroGradient ); } );
    wp.customize( 'culture_hero_gradient_end',   function( v ) { v.bind( updateHeroGradient ); } );
    wp.customize( 'culture_hero_gradient_angle',  function( v ) { v.bind( updateHeroGradient ); } );

    // Image overlay.
    function updateHeroOverlay() {
        if ( wp.customize( 'culture_hero_bg_type' ).get() !== 'image' ) return;
        var c = wp.customize( 'culture_hero_overlay_color' ).get() || '#000000';
        var o = ( parseInt( wp.customize( 'culture_hero_overlay_opacity' ).get(), 10 ) || 0 ) / 100;
        injectStyle( 'ct-hero-overlay-preview', '.ct-hero::before { background: ' + hexToRgba( c, o ) + '; }' );
    }

    wp.customize( 'culture_hero_overlay_color',   function( v ) { v.bind( updateHeroOverlay ); } );
    wp.customize( 'culture_hero_overlay_opacity',  function( v ) { v.bind( updateHeroOverlay ); } );

    /* ═══════════════════════════════════
       Hero Section — Text Colours
       ═══════════════════════════════════ */

    wp.customize( 'culture_hero_heading_color', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-hcol', '.ct-hero__heading { color: ' + to + '; }' );
        } );
    } );

    wp.customize( 'culture_hero_sub_color', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-scol', '.ct-hero__sub { color: ' + to + '; }' );
        } );
    } );

    wp.customize( 'culture_hero_sub_opacity', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-sopa', '.ct-hero__sub { opacity: ' + ( parseInt( to, 10 ) / 100 ) + '; }' );
        } );
    } );

    /* ═══════════════════════════════════
       Hero Section — Button Colours
       ═══════════════════════════════════ */

    wp.customize( 'culture_hero_btn_bg', function( value ) {
        value.bind( function( to ) {
            if ( to ) {
                injectStyle( 'ct-hero-btnbg', '.ct-hero .ct-btn--accent { background: ' + to + '; }' );
            } else {
                injectStyle( 'ct-hero-btnbg', '' );
            }
        } );
    } );

    wp.customize( 'culture_hero_btn_color', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-btncol', '.ct-hero .ct-btn--accent { color: ' + to + '; }' );
        } );
    } );

    /* ═══════════════════════════════════
       Hero Section — Layout
       ═══════════════════════════════════ */

    wp.customize( 'culture_hero_text_align', function( value ) {
        value.bind( function( to ) {
            var css = '.ct-hero { text-align: ' + to + '; }';
            if ( to === 'left' ) {
                css += '.ct-hero__inner { margin: 0; margin-right: auto; }';
            } else if ( to === 'right' ) {
                css += '.ct-hero__inner { margin: 0; margin-left: auto; }';
            } else {
                css += '.ct-hero__inner { margin: 0 auto; }';
            }
            injectStyle( 'ct-hero-align', css );
        } );
    } );

    wp.customize( 'culture_hero_padding_top', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-ptop', '.ct-hero { padding-top: ' + parseInt( to, 10 ) + 'px; }' );
        } );
    } );

    wp.customize( 'culture_hero_padding_bottom', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-hero-pbot', '.ct-hero { padding-bottom: ' + parseInt( to, 10 ) + 'px; }' );
        } );
    } );

    wp.customize( 'culture_hero_min_height', function( value ) {
        value.bind( function( to ) {
            var h = parseInt( to, 10 );
            if ( h > 0 ) {
                injectStyle( 'ct-hero-minh', '.ct-hero { min-height: ' + h + 'px; display: flex; align-items: center; justify-content: center; }' );
            } else {
                injectStyle( 'ct-hero-minh', '' );
            }
        } );
    } );

    /* ═══════════════════════════════════
       Homepage Sections — Events, Magazine
       ═══════════════════════════════════ */

    var sectionMap = {
        events:   '.ct-section--events',
        magazine: '.ct-section--magazine'
    };

    // Background colour.
    $.each( sectionMap, function( key, sel ) {
        wp.customize( 'culture_' + key + '_bg_color', function( value ) {
            value.bind( function( to ) {
                injectStyle( 'ct-' + key + '-bg', to ? ( sel + ' { background-color: ' + to + '; }' ) : '' );
            } );
        } );
    } );

    // Title colour.
    $.each( sectionMap, function( key, sel ) {
        wp.customize( 'culture_' + key + '_title_color', function( value ) {
            value.bind( function( to ) {
                injectStyle( 'ct-' + key + '-tcol', to ? ( sel + ' .ct-section__title { color: ' + to + '; }' ) : '' );
            } );
        } );
    } );

    // Padding.
    $.each( sectionMap, function( key, sel ) {
        wp.customize( 'culture_' + key + '_padding', function( value ) {
            value.bind( function( to ) {
                injectStyle( 'ct-' + key + '-pad', sel + ' { padding-top: ' + parseInt( to, 10 ) + 'px; padding-bottom: ' + parseInt( to, 10 ) + 'px; }' );
            } );
        } );
    } );

    // Section title text.
    wp.customize( 'culture_events_title', function( value ) {
        value.bind( function( to ) {
            $( '.ct-section--events .ct-section__title' ).text( to );
        } );
    } );

    wp.customize( 'culture_magazine_title', function( value ) {
        value.bind( function( to ) {
            $( '.ct-section--magazine .ct-section__title' ).text( to );
        } );
    } );

    /* ═══════════════════════════════════
       Digest Section
       ═══════════════════════════════════ */

    wp.customize( 'culture_digest_bg_color', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-digest-bg', to ? '.ct-digest-banner { background: ' + to + '; }' : '' );
        } );
    } );

    wp.customize( 'culture_digest_text_color', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-digest-tcol', '.ct-digest-banner, .ct-digest-banner h2, .ct-digest-banner p { color: ' + to + '; }' );
        } );
    } );

    wp.customize( 'culture_digest_padding', function( value ) {
        value.bind( function( to ) {
            injectStyle( 'ct-digest-pad', '.ct-section--digest { padding-top: ' + parseInt( to, 10 ) + 'px; padding-bottom: ' + parseInt( to, 10 ) + 'px; }' );
        } );
    } );

})( jQuery );
