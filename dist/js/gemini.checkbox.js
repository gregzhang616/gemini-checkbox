/**
 * Created by Greg Zhang on 2017/3/12.
 */
(function (factory, jQuery) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    factory(jQuery);
  }
})(function ($) {
  var NAMESPACE = 'checkbox';
  var EVENT_NAME_CLICK = 'click.' + NAMESPACE;
  var EVENT_NAME_CHANGE = 'change.' + NAMESPACE;
  var EVENT_NAME_CHECK = 'check.' + NAMESPACE;
  var CACHE_CHK_DATA_NAME = 'dt-chk';
  var CLASS_DISABLED = 'disabled';

  var Checkbox = function ($el, options) {
    var checkbox = this;
    var core = {
      defaults: {
        name: '', // native name property for input element
        checklist: '', // String or Array [{label:'banana', value: 1}], ['banana', 'apple', 'orange']
        disabled: null, // Boolean or Array
        defaultValue: null, // Boolean or Array
        size: 'small', // small, medium, large
        onCheck: null,
        onChange: null
      },
      init: function () {
        // copy property from options
        checkbox = $.extend(true, checkbox, core.defaults, options || {});
        if (checkbox.defaultValue !== null) checkbox.value = checkbox.defaultValue;
        core.created();
      },
      created: function () {
        var chkDOM = core.generateChkDOM();
        checkbox.$element = $(chkDOM).insertAfter($el);
        checkbox.type = checkbox.$element.hasClass('gmi-check-group') ? 'group' : 'single';
        checkbox.$inputs = checkbox.$element.find('input[type="checkbox"]');
        $el.hide();
        // cache checkbox item data
        core.cacheCheckItemData();
        // disable checkbox item
        if (checkbox.disabled !== null) core.disableChkItem();
        // bind change event for target element
        if ($.isFunction(checkbox.onChange)) $el.on(EVENT_NAME_CHANGE, checkbox.onChange);
        // set defaultValue for chk
        if (checkbox.defaultValue !== null) core.setValue(checkbox.value);
        core.bindEvent();
      },
      bindEvent: function () {
        // bind click event for chk wrapper, then the child elements're clicked can bubble to this element
        checkbox.$element.on(EVENT_NAME_CLICK, function (e) {
          var $target = $(e.target);
          var $label = $target.parents('.gmi-check-label').eq(0);
          var type = checkbox.type;
          var $icon = $target.is('em.gmi-check-label__icon') ? $target : $target.siblings('em.gmi-check-label__icon');
          var $input = $target.siblings('input[type="checkbox"]');

          // if label element has disabled class that stop click action
          if ($label.hasClass(CLASS_DISABLED)) return false;
          if ((type === 'group' && $target.is('.gmi-check-group')) || (type === 'single' && $target.is('.gmi-check-label'))) return false;

          $input.prop('checked', !$input.prop('checked'));
          if ($input.prop('checked')) {
            $icon.addClass('checked');
          } else {
            $icon.removeClass('checked');
          }
          core.changeItem($input);
          return false;
        });

        // bind check event for chk
        if ($.isFunction(checkbox.onCheck)) {
          $el.on(EVENT_NAME_CHECK, checkbox.onCheck);
        }
      },
      generateChkDOM: function () {
        var checklist = checkbox.checklist;
        var checkItem;
        var name = checkbox.name;
        var dom;
        var sizeClass = checkbox.size === 'small' ? '' : checkbox.size;
        if (isString(checklist)) {
          dom = '';
          dom += '<label class="gmi-check-label '+ sizeClass +'">' +
              '<input type="checkbox" class="gmi-check-label__chk" name="'+ name +'" autocomplete="off">' +
              '<em class="gmi-check-icon-checked gmi-check-label__icon"></em>' +
              '<span class="gmi-check-label__text">'+ checklist +'</span>' +
            '</label>';
        } else if (isArray(checklist) && checklist.length > 0) {
          var checkLen = checklist.length;
          dom = '<div class="gmi-check-group '+ sizeClass +'">';
          if (isString(checklist[0])) {
            for (var i = 0; i < checkLen; i++) {
              checkItem = checklist[i];
              dom += '<label class="gmi-check-label">' +
                '<input type="checkbox" class="gmi-check-label__chk" name="'+ name +'" autocomplete="off" value="'+ checkItem +'">' +
                '<em class="gmi-check-icon-checked gmi-check-label__icon"></em>' +
                '<span class="gmi-check-label__text">'+ checkItem +'</span>' +
                '</label>';
            }
          } else if ($.isPlainObject(checklist[0])) {
            for (var j = 0; j < checkLen; j++) {
              checkItem = checklist[j];
              dom += '<label class="gmi-check-label">' +
                '<input type="checkbox" class="gmi-check-label__chk" name="'+ name +'" autocomplete="off" value="'+ checkItem['value'] +'">' +
                '<em class="gmi-check-icon-checked gmi-check-label__icon"></em>' +
                '<span class="gmi-check-label__text">'+ checkItem['label'] +'</span>' +
                '</label>';
            }
          }
        }
        return dom;
      },
      cacheCheckItemData: function () {
        var dt = checkbox.checklist;
        if (isString(dt)) {
          checkbox.$inputs.data(CACHE_CHK_DATA_NAME, dt);
        } else if (isArray(dt)) {
          for (var i = 0; i < dt.length; i++) {
            var dtItem = dt[i];
            checkbox.$inputs.eq(i).data(CACHE_CHK_DATA_NAME, dtItem);
          }
        }
      },
      disableChkItem: function () {
        var $inputs = checkbox.$inputs;
        var type = checkbox.type;
        var disabled = arguments[0] === undefined ? checkbox.disabled : arguments[0];

        // clear disabled class
        checkbox.$element.find('.gmi-check-label').removeClass(CLASS_DISABLED);
        if (isBoolean(disabled) && type === 'single') {
          if (disabled) $inputs.parents('.gmi-check-label').eq(0).addClass(CLASS_DISABLED);
        } else if (isArray(disabled) && disabled.length > 0 && type === 'group') {
          for (var i = 0; i < disabled.length; i++) {
            var disabledDt = disabled[i];
            $inputs.each(function () {
              var dt = $(this).data(CACHE_CHK_DATA_NAME);
              var itemDt;
              if (isString(dt)) {
                itemDt = dt;
              } else if ($.isPlainObject(dt)) {
                itemDt = dt['value'];
              }
              if (disabledDt === itemDt) {
                $(this).parents('.gmi-check-label').eq(0).addClass(CLASS_DISABLED);
              }
            });
          }
        }
      },
      triggerEvent: function (src, data) {
        var evt = $.Event(src, data);
        $el.trigger(evt);
        return evt;
      },
      changeItem: function ($input) {
        var type = checkbox.type;
        var isChecked = $input.prop('checked');
        var checkedValue;
        switch (type) {
          case 'single':
            checkbox.value = isChecked ? true : false;
            break;
          case 'group':
            if (checkbox.value === undefined) checkbox.value = [];
            if (isChecked) {
              if (isString($input.data(CACHE_CHK_DATA_NAME))) {
                checkbox.value.push($input.data(CACHE_CHK_DATA_NAME));
              } else {
                checkbox.value.push($input.data(CACHE_CHK_DATA_NAME)['value']);
              }
            } else {
              if (isArray(checkbox.value) && checkbox.value.length > 0) {
                var index;
                if (isString($input.data(CACHE_CHK_DATA_NAME))) {
                  index = checkbox.value.indexOf($input.data(CACHE_CHK_DATA_NAME));
                } else {
                  index = checkbox.value.indexOf($input.data(CACHE_CHK_DATA_NAME)['value']);
                }
                checkbox.value.splice(index, 1);
              }
            }
            break;
          default:
            break;
        }

        checkedValue = isString($input.data(CACHE_CHK_DATA_NAME)) ? $input.data(CACHE_CHK_DATA_NAME) : $input.data(CACHE_CHK_DATA_NAME)['value'];
        core.triggerEvent(EVENT_NAME_CHECK,
          {checkedStatus: isChecked, checkedValue: checkedValue, newValue: checkbox.value});
        core.triggerEvent(EVENT_NAME_CHANGE, {newValue: checkbox.value});
      },
      setValue: function () {
        var $inputs = checkbox.$element.find('input[type="checkbox"]');
        var $icon;
        var value = arguments[0];
        if (checkbox.type === 'single') {
          if (isBoolean(value)) {
            $icon = $inputs.prop('checked', value).siblings('em.gmi-check-label__icon');
            if (value) {
              $icon.addClass('checked');
            } else {
              $icon.removeClass('checked');
            }
          }
        } else { // group
          if (isArray(value) && value.length > 0) {
            $inputs.each(function () {
              var $self = $(this);
              var dt = $self.data(CACHE_CHK_DATA_NAME);
              var chkItemDt;
              $icon = $self.siblings('em.gmi-check-label__icon');
              if (isString(dt)) {
                chkItemDt = dt;
              } else {
                chkItemDt = dt['value'];
              }
              if (value.indexOf(chkItemDt) !== -1) {
                $self.prop('checked', true);
                $icon.addClass('checked');
              } else {
                $self.prop('checked', false);
                $icon.removeClass('checked');
              }
            });
          }
        }
        core.triggerEvent(EVENT_NAME_CHANGE, {newValue: value});
        checkbox.value = value;
      },
      clear: function () {
        var type = checkbox.type;
        var value = type === 'single' ? false : [];
        checkbox.$inputs.prop('checked', false).siblings('em.gmi-check-label__icon').removeClass('checked');
        core.triggerEvent(EVENT_NAME_CHANGE, {newValue: value});
        checkbox.value = value;
      }
    };

    checkbox.getValue = function () {
      return checkbox.value;
    };

    checkbox.setValue = function (value) {
      core.setValue(value);
    };

    checkbox.clear = function () {
      core.clear();
    };

    checkbox.disable = function () {
      var type = checkbox.type;
      var disabled;
      if (type === 'single') {
        disabled = arguments[0] === undefined ? true : arguments[0];
      } else {
        var args = [];
        checkbox.$inputs.each(function () {
          var dt = $(this).data(CACHE_CHK_DATA_NAME);
          if (isString(dt)) {
            args.push(dt);
          } else if ($.isPlainObject(dt)) {
            args.push(dt['value']);
          }
        });
        disabled = arguments[0] === undefined ? args : arguments[0];
      }
      core.disableChkItem(disabled);
    };

    core.init();
  };

  $.fn.checkbox = function (options) {
    var args = toArray(arguments, 1);
    var options = options || {};
    var $self = this;
    var result;

    $self.each(function () {
      var data = $(this).data('checkbox');
      var fn;
      if (!data) {
        if (/destroy/.test(options)) {
          return false;
        }
        if (!isString(options)) return $(this).data('checkbox', (data = new Checkbox($(this), options)));
      }
      if (data && isString(options) && $.isFunction(fn = data[options])) {
        result = fn.apply(data, args);
      }
    });
    return typeof result === 'undefined' ? $self : result;
  };

  function toArray (obj, offset) {
    var args = [];
    if (Array.from) {
      return Array.from(obj).slice(offset || 0);
    }
    if (typeof offset === 'number' && !isNaN(offset)) {
      args.push(offset);
    }
    return args.slice.apply(obj, args);
  }

  function isArray (arr) {
    return typeof arr === 'object' && arr instanceof Array;
  }

  Array.prototype.indexOf = function (searchElement, fromIndex) {
    var index = -1;
    fromIndex = fromIndex * 1 || 0;

    for (var k = 0, length = this.length; k < length; k++) {
      if (k >= fromIndex && this[k] === searchElement) {
        index = k;
        break;
      }
    }
    return index;
  };

  function isString (str) {
    return typeof str === 'string';
  }

  function isBoolean (bln) {
    return typeof bln === 'boolean';
  }

}, window.jQuery);
