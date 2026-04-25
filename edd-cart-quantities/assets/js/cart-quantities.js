/* global eddcq */

jQuery(function ($) {
  'use strict';

  // ── Currency formatter using WP-localised EDD settings ─────────────────────

  function formatPrice(amount) {
    var fixed     = parseFloat(amount).toFixed(eddcq.decimals);
    var parts     = fixed.split('.');
    var thousands = eddcq.thousandsSep;
    var decimal   = eddcq.decimalSep;

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    var number = parts.join(decimal);

    return eddcq.currencyPos === 'before'
      ? eddcq.currencySymbol + number
      : number + eddcq.currencySymbol;
  }

  // ── Parse a formatted price string back to a float ─────────────────────────

  function parsePrice(str) {
    // Strip everything except digits and the decimal separator.
    var dec     = eddcq.decimalSep || '.';
    var escaped = dec.replace('.', '\\.');
    var cleaned = str.replace(new RegExp('[^0-9' + escaped + ']', 'g'), '')
                     .replace(dec, '.');
    return parseFloat(cleaned) || 0;
  }

  // ── Cart page: inject +/− controls and handle qty changes ──────────────────

  var Cart = {

    debounceTimer: null,

    init: function () {
      if (!$('#edd_checkout_cart, .edd_checkout_cart, #edd_cart_form, #edd_cart').length) return;
      this.inject();
      this.bindCart();
    },

    inject: function () {
      // Match rows by the edd_cart_item_ ID prefix (all EDD versions).
      var $rows = $('tr[id^="edd_cart_item_"]');
      if (!$rows.length) $rows = $('tr.edd_cart_item, li.edd_cart_item');

      $rows.each(function () {
        var $row    = $(this);
        var rowId   = $row.attr('id') || '';
        var cartKey = rowId.replace('edd_cart_item_', '');

        if (!cartKey || cartKey === rowId) {
          cartKey = $row.data('cart-key') || $row.data('key');
          if (cartKey === undefined || cartKey === '') return;
        }

        if ($row.find('.eddcq-wrap').length) return; // already injected

        // Read current qty from any existing EDD qty input; default 1.
        var currentQty = parseInt(
          $row.find('input[name*="quantity"], input[name*="qty"]').val() ||
          $row.find('.edd_cart_item_quantity').text(), 10
        ) || 1;

        // Find the price cell and read the unit price from its current text.
        // We look for the SECOND td (price column) across multiple EDD class names.
        var $priceCell = $row.find('.edd_cart_item_price').first();
        if (!$priceCell.length) $priceCell = $row.find('td').eq(1);

        // Store the unit price now (before quantity may have made it a line total).
        // Divide by current qty so we always have the per-unit value.
        var rawPrice = parsePrice($priceCell.text());
        var unitPrice = currentQty > 1 ? rawPrice / currentQty : rawPrice;

        // Name cell: first td or EDD-named cell.
        var $nameCell = $row.find(
          '.edd_cart_item_name, .edd_item_name, .edd_cart_item_title, td:first-child'
        ).first();

        if (!$nameCell.length) return;

        $nameCell.append(
          '<div class="eddcq-wrap"' +
            ' data-cart-key="'  + cartKey   + '"' +
            ' data-unit-price="' + unitPrice + '">' +
            '<button class="eddcq-btn eddcq-minus" type="button" aria-label="Decrease">&#8722;</button>' +
            '<input  class="eddcq-input" type="number" value="' + currentQty + '" min="1" max="999" aria-label="Quantity">' +
            '<button class="eddcq-btn eddcq-plus"  type="button" aria-label="Increase">+</button>' +
          '</div>'
        );

        // Point the row at its price cell so applyPrice() can find it later.
        $row.data('eddcq-price-cell', $priceCell);
      });
    },

    bindCart: function () {
      $(document)
        .on('click', '.eddcq-wrap .eddcq-minus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) $input.val(val - 1).trigger('eddcq:commit');
        })
        .on('click', '.eddcq-wrap .eddcq-plus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1).trigger('eddcq:commit');
        })
        .on('input', '.eddcq-wrap .eddcq-input', function () {
          var $input = $(this);
          clearTimeout(Cart.debounceTimer);
          Cart.debounceTimer = setTimeout(function () {
            $input.trigger('eddcq:commit');
          }, 600);
        })
        .on('eddcq:commit', '.eddcq-wrap .eddcq-input', function () {
          var $input    = $(this);
          var $wrap     = $input.closest('.eddcq-wrap');
          var cartKey   = $wrap.data('cart-key');
          var unitPrice = parseFloat($wrap.data('unit-price')) || 0;
          var quantity  = Math.max(1, parseInt($input.val(), 10) || 1);
          $input.val(quantity);

          // 1. Update the price cell immediately in the browser (no AJAX wait).
          var $row = $wrap.closest('tr, li');
          var $priceCell = $row.data('eddcq-price-cell') ||
                           $row.find('.edd_cart_item_price, td').eq(1);
          if (unitPrice > 0) {
            $priceCell.text(formatPrice(unitPrice * quantity));
          }

          // 2. Persist to server and refresh subtotal/total.
          Cart.sync(cartKey, quantity, $row);
        });
    },

    sync: function (cartKey, quantity, $row) {
      $row.addClass('eddcq-loading');

      $.post(eddcq.ajaxUrl, {
        action:   'eddcq_update',
        nonce:    eddcq.nonce,
        cart_key: cartKey,
        quantity: quantity,
      })
      .done(function (response) {
        if (!response || !response.success) return;
        Cart.applyTotals(response.data);
      })
      .always(function () {
        $row.removeClass('eddcq-loading');
      });
    },

    applyTotals: function (data) {
      if (data.subtotal) {
        $('.edd_cart_subtotal_amount, .edd_subtotal_amount, #edd_cart_subtotal .edd_cart_amount')
          .text(data.subtotal);
      }
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

  // ── Download page: +/− on the PHP-rendered qty input ───────────────────────

  var Download = {

    init: function () {
      if (!$('.eddcq-dl-qty-wrap').length) return;
      this.bindDownload();
    },

    bindDownload: function () {
      $(document)
        .on('click', '.eddcq-wrap--inline .eddcq-minus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          if (val > 1) $input.val(val - 1);
        })
        .on('click', '.eddcq-wrap--inline .eddcq-plus', function () {
          var $input = $(this).siblings('.eddcq-input');
          var val    = parseInt($input.val(), 10) || 1;
          $input.val(val + 1);
        });
    },
  };

  // ── Boot ───────────────────────────────────────────────────────────────────

  Cart.init();
  Download.init();
});
