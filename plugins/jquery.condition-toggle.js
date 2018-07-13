(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node / Browserify
        //isomorphic issue
        var jQuery = (typeof window != 'undefined') ? window.jQuery : undefined;
        if (!jQuery) {
            jQuery = require('jquery');
            if (!jQuery.fn) jQuery.fn = {};
        }
        factory(jQuery);
    } else {
        // Browser globals
        factory(root.jQuery);
    }
}(this, function($) {
    "use strict";

    var pluginName = "conditionToggle",
        defaults = {
            condition: null,
            action: "show",
            options: null,
            setValue: null,
            duration: "fast",
            context: "body",
            onEnable: null,
            onDisable: null
        };

    function ConditionToggle(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(ConditionToggle.prototype, {
        init: function () {
            var plugin = this;
            plugin.settings.condition = this.$element.data('condition') || plugin.settings.condition;

            plugin.settings.options = this.$element.data('condition-options') || plugin.settings.options;
            if (plugin.settings.options) {
                this.toggleOptions();
                return;
            }

            plugin.settings.setValue = this.$element.data('condition-set-value') || plugin.settings.setValue;
            if (plugin.settings.setValue) {
                this.toggleValues();
                return;
            }

            $.each(plugin.settings.condition.split(/[;,]+/), function (index, ref) {
                ref = $('#' + ref.split(':')[0], plugin.settings.context);
                ref.on(ref.data('iCheck') || ref.is('div') && ref.find(':radio:first').data('iCheck') ? 'ifChanged' : 'change', function () {
                    plugin.toggle();
                });
            });
            plugin.toggle(false);
        },

        toggle: function (duration) {
            var element = this.$element;
            var settings = this.settings;

            if (settings.options) {
                return;
            }

            var action = element.data('condition-action') || settings.action;
            action = action.split('|');
            var action2 = action[1];
            action = action[0];
            var showHide = action == 'show' || action == 'hide';
            action = action == 'enable' || action == 'show';
            if (typeof duration == 'undefined') {
                duration = element.data('condition-duration');
                if (typeof duration == 'undefined') {
                    duration = 'fast';
                }
            }
            var enabled = false;
            $.each(this.settings.condition.split(';'), function (index, refGroup) {
                var groupEnabled = true;
                $.each(refGroup.split(','), function (index, ref) {
                    ref = ref.split(':');
                    var options = ref[1];
                    ref = $('#' + ref[0], settings.context);
                    if (ref.is('a')) {
                        groupEnabled = ref.is('.active');
                        return groupEnabled;
                    }
                    if (ref.is(':checkbox, :radio')) {
                        if (!ref.is(':checked')) {
                            groupEnabled = false;
                            return groupEnabled;
                        }
                        groupEnabled = 'checked' === options || ref.is(':enabled');
                        return groupEnabled;
                    }
                    if (ref.is(':input:not(select)')) {
                        if (!ref.is(':enabled')) {
                            groupEnabled = false;
                            return false;
                        }
                        $.each(options.split('|'), function (index, value) {
                            var not = '!' == value.charAt(0);
                            if (not) {
                                value = value.substring(1);
                            }
                            var refValue = ref.val();
                            if ($.isNumeric(value)) {
                                value = parseFloat(value);
                                refValue = parseFloat(refValue.replace(',', '.'));
                            }
                            if (not) {
                                groupEnabled = refValue != value;
                            } else {
                                groupEnabled = refValue == value;
                            }
                            return groupEnabled;
                        });
                        return groupEnabled;
                    }
                    if (typeof options == 'undefined') {
                        groupEnabled = ref.val() ? true : false;
                        return groupEnabled;
                    }
                    options = '[value="' + options.split('|').join('"],[value="') + '"]';
                    if (
                        ref.is('select') && !ref.find(options).is(':selected') ||
                        ref.is('div') && !ref.find(options).is(':checked')
                    ) {
                        groupEnabled = false;
                        return false;
                    }
                });
                if (groupEnabled) {
                    enabled = true;
                    return false;
                }
            });
            if (enabled ^ action) {
                if (this.settings.onDisable) {
                    this.settings.onDisable.call(this.element);
                }
                element.find(':button:disabled:not([data-condition-disabled])').attr('data-original-disabled', 'true');
                element.find(':button').attr('data-condition-disabled', 'true');
                element.find(':input').prop('disabled', true);
                if ('check' == action2) {
                    element.find(':checkbox').each(function () {
                        var $this = $(this);
                        if ($this.data('iCheck')) {
                            $this.iCheck('check');
                        } else {
                            $this.prop('checked', true);
                        }
                    });
                } else if ('reset' == action2) {
                    element.find('input:text, input[type=number]').each(function () {
                        var $this = $(this);
                        var value = $this.data('condition-reset');
                        value = 'undefined' === typeof value ? '' : value;
                        $this.val(value);
                    });
                    element.find('select').each(function () {
                        var $this = $(this);
                        var value = $this.data('condition-reset');
                        value = 'undefined' === typeof value ? '' : value;
                        $this.val(value).trigger('change');
                    });
                    element.find('.radio:first-child').parent().each(function () {
                        var $this = $(this);
                        var value = $this.data('condition-reset');
                        value = 'undefined' === typeof value ? '' : value;
                        $this.find('input:radio[value="'+value+'"]').prop('checked', true).trigger('change');
                    });
                }
                if (showHide) {
                    if (duration) {
                        element.slideUp(duration);
                    } else {
                        element.hide();
                    }
                }
            } else {
                if (this.settings.onEnable) {
                    this.settings.onEnable.call(this.element);
                }
                element.find(':input:not(:button)[data-disabled!=true]').prop('disabled', false).removeAttr('data-original-disabled');
                element.find(':button[data-condition-disabled][data-disabled!=true][data-original-disabled!=true]').prop('disabled', false);
                element.find(':button[data-condition-disabled][data-original-disabled=true]').removeAttr('data-original-disabled');
                element.find(':button[data-condition-disabled]').removeAttr('data-condition-disabled');
                if (showHide) {
                    if (duration) {
                        element.slideDown(duration);
                    } else {
                        element.show();
                    }
                }
                element.find('[data-condition]').each(function () {
                    var toggle = $(this).data('conditionToggle');
                    if (toggle && !toggle.settings.options && !toggle.settings.setValue) {
                        toggle.toggle();
                    }
                });
            }
        },

        toggleOptions: function () {
            var element = this.$element;
            var settings = this.settings;

            var conditions = element.data('condition-options') || settings.options;
            var refSelect = $('#' + settings.condition, settings.context);
            var options = [];
            var selected = element.find(':selected');
            $.each(conditions, function (refId, optIds) {
                options[refId] = [];
                $.each(optIds, function (index, optId) {
                    var option = element.find('[value="' + optId + '"]');
                    if (options && option.length) {
                        options[refId].push(option[0]);
                        //option.remove();
                    }
                });
            });

            element.find(':not([value])').val("");
            refSelect.find(':not([value])').val("");
            element.find('[value!=""]').remove();
            var refSelected = refSelect.find(':selected').val();
            if (refSelected != '') {
                element.append(options[refSelected] || options.default);
            } else {
                element.prop('disabled', true).attr('data-disabled', true);
            }
            element.val(selected.val());
            refSelect.on('change', function (event) {
                var selectedVal = element.val();
                element.find('[value!=""]').remove();
                var val = refSelect.val();
                if (val != '') {
                    element.prop('disabled', false).attr('data-disabled', false);
                    element.append(options[val] || options.default);
                } else {
                    element.prop('disabled', true).attr('data-disabled', true);
                }
                element.val(selectedVal).trigger('change');
            });
        },

        toggleValues: function () {
            var element = this.$element;
            var settings = this.settings;

            var refSelect = $('#' + settings.condition, settings.context);
            var change = function () {
                // .trigger('setvalue') for inputmask
                if (typeof settings.setValue[refSelect.val()] != "undefined") {
                    element.val(settings.setValue[refSelect.val()]).trigger('setvalue');
                } else if (typeof settings.setValue.default != "undefined") {
                    element.val(settings.setValue.default).trigger('setvalue');
                }
            };
            refSelect.change(change);
            if ('' == element.val()) {
                change();
            }
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new ConditionToggle(this, options));
            }
        });
    };

}));
