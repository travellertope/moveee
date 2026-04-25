/* global eddcq */

jQuery(function ($) {
  'use strict';

  var EddCQ = {

    debounceTimer: null,

    init: function () {
      if (!$('#edd_checkout_cart, .edd_checkout_cart').length) return;
      this.inject();
      this.bind();
    },

    // ── Inject +/− controls into each cart row ────────────────────────────────

    inject: function () {
      var $rows = $('tr[id^="edd_cart_item_"]');
      if (!$rows.length) $rows = $('.edd_cart_item');

      $rows.each(function () {
        var $row    = $(this);
        var rowId   = $row.attr('id') || '';
        var cartKey = rowId.replace('edd_cart_item_', '');

        if (!cartKey || cartKey === rowId) {
          cartKey = $row.data('cart-key') || $row.data('key');
          if (cartKey === undefined || cartKey === '') return;
        }

        if ($row.find('.eddcq-wrap').length) return;

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

    // ── Event delegation ──────────────────────────────────────────────────────

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
        $row.removeClass('eddcq-loading');
        if (!response || !response.success) return;
        EddCQ.applyData(response.data);
      })
      .fail(function () {
        $row.removeClass('eddcq-loading');
      });
    },

    // ── Update prices and totals directly in the DOM ──────────────────────────

    applyData: function (data) {
      // Per-item line totals (unit price × quantity).
      if (data.items) {
        $.each(data.items, function (key, item) {
          var $row = $('#edd_cart_item_' + key);
          if (!$row.length) return;

          // Update the price cell with the line total.
          $row.find(
            '.edd_cart_item_price, .edd_item_price, td.edd_cart_item_price, td:nth-child(2)'
          ).first().text(item.line_total);

          // Keep the quantity input in sync.
          $row.find('.eddcq-input').val(item.quantity);
        });
      }

      // Subtotal row.
      if (data.subtotal) {
        $(
          '.edd_cart_subtotal_amount, ' +
          '.edd_subtotal_amount, ' +
          '#edd_cart_subtotal .edd_cart_amount'
        ).text(data.subtotal);
      }

      // Grand total — covers both the cart tfoot and the payment form total.
      if (data.total) {
        $(
          '#edd_final_total_wrap .edd_cart_amount, ' +
          '.edd_cart_total .edd_cart_amount, ' +
          '#edd_cart_total .edd_cart_amount, ' +
          '.edd_cart_total_amount, ' +
          '#edd_checkout_total_container, ' +
          '[data-edd-total]'
        ).text(data.total);
      }
    },
  };

  EddCQ.init();
});
