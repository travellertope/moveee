/**
 * Culture Theme – Front-end JavaScript.
 *
 * Handles: sticky header, mobile menu, search overlay, share copy, dark mode.
 */
( function () {
	'use strict';

	/* ------------------------------------------------------------------ */
	/*  Sticky header – hide on scroll-down, show on scroll-up            */
	/* ------------------------------------------------------------------ */
	var header      = document.getElementById( 'ct-header' );
	var lastScrollY = 0;
	var ticking     = false;

	function onScroll() {
		var currentY = window.scrollY;

		if ( ! header ) {
			return;
		}

		if ( currentY > lastScrollY && currentY > 80 ) {
			header.classList.add( 'ct-header--hidden' );
		} else {
			header.classList.remove( 'ct-header--hidden' );
		}

		lastScrollY = currentY;
		ticking     = false;
	}

	window.addEventListener( 'scroll', function () {
		if ( ! ticking ) {
			window.requestAnimationFrame( onScroll );
			ticking = true;
		}
	} );

	/* ------------------------------------------------------------------ */
	/*  Toggle helper (search overlay & mobile menu)                      */
	/* ------------------------------------------------------------------ */
	var mobileMenu    = document.getElementById( 'ct-mobile-menu' );
	var searchOverlay = document.getElementById( 'ct-search-overlay' );

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '[data-toggle]' );
		if ( ! btn ) {
			return;
		}

		var target = btn.getAttribute( 'data-toggle' );

		if ( target === 'menu' && mobileMenu ) {
			togglePanel( mobileMenu );
		}

		if ( target === 'search' && searchOverlay ) {
			togglePanel( searchOverlay );
			if ( ! searchOverlay.hidden ) {
				var input = searchOverlay.querySelector( 'input[type="search"], input[name="s"]' );
				if ( input ) {
					input.focus();
				}
			}
		}
	} );

	function togglePanel( el ) {
		var isHidden = el.hidden;
		el.hidden    = ! isHidden;

		if ( ! isHidden ) {
			document.body.classList.remove( 'ct-no-scroll' );
		} else {
			document.body.classList.add( 'ct-no-scroll' );
		}

		// Update aria-expanded on related hamburger button.
		var hamburger = document.querySelector( '.ct-header__hamburger' );
		if ( hamburger && el === mobileMenu ) {
			hamburger.setAttribute( 'aria-expanded', isHidden ? 'true' : 'false' );
		}
	}

	// Close panels on Escape key.
	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' ) {
			if ( mobileMenu && ! mobileMenu.hidden ) {
				togglePanel( mobileMenu );
			}
			if ( searchOverlay && ! searchOverlay.hidden ) {
				togglePanel( searchOverlay );
			}
		}
	} );

	/* ------------------------------------------------------------------ */
	/*  Share – copy link to clipboard                                    */
	/* ------------------------------------------------------------------ */
	document.addEventListener( 'click', function ( e ) {
		var copyBtn = e.target.closest( '.ct-share__copy' );
		if ( ! copyBtn ) {
			return;
		}

		var url = copyBtn.getAttribute( 'data-url' );
		if ( ! url ) {
			return;
		}

		if ( navigator.clipboard && navigator.clipboard.writeText ) {
			navigator.clipboard.writeText( url ).then( function () {
				showCopyFeedback( copyBtn );
			} );
		} else {
			// Fallback for older browsers.
			var textarea       = document.createElement( 'textarea' );
			textarea.value     = url;
			textarea.style.position = 'fixed';
			textarea.style.opacity  = '0';
			document.body.appendChild( textarea );
			textarea.select();
			document.execCommand( 'copy' );
			document.body.removeChild( textarea );
			showCopyFeedback( copyBtn );
		}
	} );

	function showCopyFeedback( btn ) {
		btn.classList.add( 'ct-share__copy--done' );
		setTimeout( function () {
			btn.classList.remove( 'ct-share__copy--done' );
		}, 1500 );
	}

	/* ------------------------------------------------------------------ */
	/*  Dropdown navigation – keyboard & hover                            */
	/* ------------------------------------------------------------------ */
	var navItems = document.querySelectorAll( '.ct-nav-list > li' );

	navItems.forEach( function ( item ) {
		var submenu = item.querySelector( 'ul' );
		if ( ! submenu ) {
			return;
		}

		// Show submenu on focus-within for keyboard users.
		item.addEventListener( 'focusin', function () {
			item.classList.add( 'ct-nav-open' );
		} );
		item.addEventListener( 'focusout', function () {
			// Delay to allow focus to move to submenu items.
			setTimeout( function () {
				if ( ! item.contains( document.activeElement ) ) {
					item.classList.remove( 'ct-nav-open' );
				}
			}, 10 );
		} );
	} );

	/* ------------------------------------------------------------------ */
	/*  Smooth-scroll for anchor links                                    */
	/* ------------------------------------------------------------------ */
	document.addEventListener( 'click', function ( e ) {
		var link = e.target.closest( 'a[href^="#"]' );
		if ( ! link ) {
			return;
		}

		var id     = link.getAttribute( 'href' ).slice( 1 );
		var target = id ? document.getElementById( id ) : null;

		if ( target ) {
			e.preventDefault();
			target.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}
	} );

	/* ------------------------------------------------------------------ */
	/*  Archive layout toggle (grid ↔ list)                               */
	/* ------------------------------------------------------------------ */
	var layoutBtns = document.querySelectorAll( '.ct-layout-toggle__btn' );

	layoutBtns.forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			var layout = btn.getAttribute( 'data-layout' );
			var grid   = document.querySelector( '.ct-magazine-grid, .ct-archive-grid' );

			if ( ! grid || ! layout ) {
				return;
			}

			grid.classList.remove( 'ct-magazine-grid--list', 'ct-magazine-grid--grid' );
			grid.classList.add( 'ct-magazine-grid--' + layout );

			layoutBtns.forEach( function ( b ) {
				b.classList.remove( 'ct-layout-toggle__btn--active' );
			} );
			btn.classList.add( 'ct-layout-toggle__btn--active' );
		} );
	} );

} )();
