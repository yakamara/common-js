;(function ($, window, document, undefined) {
    "use strict";

    var pluginName = "conditionToggle",
        defaults = {
            condition: null,
            action: "show",
            duration: "fast",
            context: "body"
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
            $.each(plugin.settings.condition.split(/[;,]+/), function (index, ref) {
                ref = $('#' + ref.split(':')[0], plugin.settings.context);
                ref.on('ifChanged change', function () {
                    plugin.toggle();
                });
            });
            plugin.toggle(false);
        },

        toggle: function (duration) {
            var element = this.$element;
            var settings = this.settings;
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
                    if (options) {
                        options = '[value=' + options.split('|').join('],[value=') + ']';
                    }
                    ref = $('#' + ref[0], settings.context);
                    if (
                        ref.is('select') && !ref.find(options).is(':selected') ||
                        ref.is('div') && !ref.find(options).is(':checked') ||
                        ref.is('input') && !ref.is(':enabled:checked')
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
                //element.find('input[type="checkbox"],input[type="radio"]').iCheck('disable');
                element.find(':input:not(:button)').prop('disabled', true);
                if (showHide) {
                    if (duration) {
                        element.slideUp(duration);
                    } else {
                        element.hide();
                    }
                }
            } else {
                //element.find('input[data-disabled!=true][type="checkbox"],input[data-disabled!=true][type="radio"]').iCheck('enable');
                element.find(':input:not(:button)[data-disabled!=true]').prop('disabled', false);
                if (showHide) {
                    if (duration) {
                        element.slideDown(duration);
                    } else {
                        element.show();
                    }
                }
                element.find('[data-condition]').each(function () {
                    $(this).data('conditionToggle').toggle();
                });
            }
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new ConditionToggle(this, options));
            }
        });
    };

})(jQuery, window, document);
