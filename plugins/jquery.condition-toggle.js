;(function ($, window, document, undefined) {
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
                ref.on(ref.data('iCheck') ? 'ifChanged' : 'change', function () {
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
                    if (typeof options != 'undefined') {
                        options = '[value="' + options.split('|').join('"],[value="') + '"]';
                    }
                    ref = $('#' + ref[0], settings.context);
                    if (
                        ref.is('select') && !ref.find(options).is(':selected') ||
                        ref.is('div') && !ref.find(options).is(':checked') ||
                        ref.is('input') && !ref.is(':enabled:checked') ||
                        ref.is('a') && !ref.is('.active')
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
                    if (toggle) {
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

})(jQuery, window, document);
