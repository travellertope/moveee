/* global eddcq */
/* jshint browser: true */

jQuery(function ($) {
  'use strict';

  var EddCQ = {

    debounceTimer: null,

    init: function () {
      if (!$('#edd_checkout_cart, .edd_checkout_cart').length) return;
      this.inject();
      this.bind();
    },

    // ── Inject quantity controls into each cart row ───────────────────────────

    inject: function () {
      // Match rows by ID prefix — reliable across all EDD versions.
      var $rows = $('tr[id^="edd_cart_item_"]');

      // Fallback: class-based match for themes that strip IDs.
      if (!$rows.length) {
        $rows = $('.edd_cart_item');
      }

      $rows.each(function () {
        var $row    = $(this);
        var rowId   = $row.attr('id') || '';
        var cartKey = rowId.replace('edd_cart_item_', '');

        // If ID pattern didn't match, try data attributes.
        if (!cartKey || cartKey === rowId) {
          cartKey = $row.data('cart-key') || $row.data('key');
          if (cartKey === undefined || cartKey === '') return;
        }

        if ($row.find('.eddcq-wrap').length) return; // already injected

        var currentQty = parseInt(
          $row.find('input[name*="quantity"], input[name*="qty"]').val() ||
          $row.find('.edd_cart_item_quantity').text(),
          10
        ) || 1;

        var $cell = $row.find(
          '.edd_cart_item_name, .edd_item_name, .edd_cart_item_title, td:first-child'
        ).first();

        if (!$cell.length) return;

        $cell.append(
          '<div class="eddcq-wrap" data-cart-key="' + cartKey + '">' +
            '<button class="eddcq-btn eddcq-minus" type="button" aria-label="Decrease">&#8722;</button>' +
            '<input  class="eddcq-input" type="number" value="' + currentQty + '" min="1" max="999" aria-label="Quantity">' +
            '<button class="eddcq-btn eddcq-plus"  type="button" aria-label="Increase">+</button>' +
          '</div>'
        );
      });
    },

    // ── Event delegation — survives cart HTML swaps ───────────────────────────

    bind: function () {
      $(document)
        .on('click', '.eddcq-minus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) $input.val(val - 1).trigger('eddcq:commit');
        })
        .on('click', '.eddcq-plus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1).trigger('eddcq:commit');
        })
        .on('input', '.eddcq-input', function () {
          var $input = $(this);
          clearTimeout(EddCQ.debounceTimer);
          EddCQ.debounceTimer = setTimeout(function () {
            $input.trigger('eddcq:commit');
          }, 650);
        })
        .on('eddcq:commit', '.eddcq-input', function () {
          var $input   = $(this);
          var cartKey  = $input.closest('.eddcq-wrap').data('cart-key');
          var quantity = Math.max(1, parseInt($input.val(), 10) || 1);
          $input.val(quantity);
          EddCQ.update(cartKey, quantity, $input.closest('tr, li'));
        });
    },

    // ── AJAX ─────────────────────────────────────────────────────────────────

    update: function (cartKey, quantity, $row) {
      $row.addClass('eddcq-loading');

      $.post(eddcq.ajaxUrl, {
        action:   'eddcq_update',
        nonce:    eddcq.nonce,
        cart_key: cartKey,
        quantity: quantity,
      })
      .done(function (response) {
        if (!response || !response.success) {
          $row.removeClass('eddcq-loading');
          return;
        }
        EddCQ.swapCart(response.data.cart_html);
        EddCQ.updateTotal(response.data.total);
      })
      .fail(function () {
        $row.removeClass('eddcq-loading');
      });
    },

    swapCart: function (html) {
      if (!html) return;
      var $parsed = $($.parseHTML(html));
      var $new    = $parsed.filter('#edd_checkout_cart');
      if (!$new.length) $new = $parsed.find('#edd_checkout_cart');
      if ($new.length) $('#edd_checkout_cart').replaceWith($new);
      EddCQ.inject();
    },

    updateTotal: function (total) {
      if (!total) return;
      $.each([
        '#edd_final_total_wrap .edd_cart_amount',
        '.edd_cart_total .edd_cart_amount',
        '#edd_cart_total .edd_cart_amount',
        '.edd_cart_total_amount',
        '#edd_checkout_total_container',
        '[data-edd-total]',
      ], function (_, sel) {
        $(sel).text(total);
      });
    },
  };

  EddCQ.init();
});
