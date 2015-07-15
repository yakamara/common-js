;(function ($, window, document, undefined) {
    "use strict";

    var pluginName = "yPopover",
        defaults = {
            container: 'body',
            popoverClass: '',
            template: '<div class="popover"><div class="arrow"></div><button class="close" type="button">×</button><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
            onChange: undefined,
            onSuccess: undefined,
            onError: undefined
        };

    function YPopover(element, options) {
        this.element = element;
        this.$element = $(element);
        this.url = this.$element.is('[data-url]') ? this.$element.data('url') : this.$element.attr('href');
        this.settings = $.extend({}, defaults, options);
        this.isLoading = false;
        this.deactivateButton = false;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(YPopover.prototype, {
        init: function () {
            var plugin = this;
            var element = plugin.$element;

            element.popover({
                html: true,
                title: element.is('[data-title]') ? element.data('title') : element.text(),
                trigger: 'manual',
                template: plugin.settings.template
            }).on('shown.bs.popover', function () {
                plugin.popover = element.data('bs.popover').$tip;
                var popover = plugin.popover;
                plugin.loadContent();
                popover.find('button.close').click(function () {
                    element.popover('hide');
                });
                if (!element.hasClass('active')) {
                    element.addClass('active');
                    plugin.deactivateButton = true;
                }
            }).on('hidden.bs.popover', function () {
                if (plugin.deactivateButton) {
                    element.removeClass('active');
                }
                clearInterval(plugin.resizeInterval);
            }).click(function () {
                element.popover('toggle');
                return false;
            });
        },

        loadContent: function () {
            var plugin = this;

            var popover = plugin.popover;
            var height = popover.height();
            // bootstrap issue hack
            //if ((popover.hasClass('left') || popover.hasClass('right')) && parseInt(popover.css('top')) > 0) {
            //    popover.css('top', 0);
            //    popover.find('.arrow').css('top', '30px');
            //}
            plugin.resizeInterval = setInterval(function () {
                if (height && popover.height() != height) {
                    if (popover.hasClass('left') || popover.hasClass('right')) {
                        popover.css('top', parseInt(popover.css('top')) + (height - popover.height()) / 2)
                    }
                    height = popover.height();
                }
            }, 100);

            $.get(this.url).done(function (data) {
                plugin.replaceContent(data);
                if (!plugin.$element.closest('.no-focus').length) {
                    popover.find(':input:not(:button):first').focus();
                }
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError(response, plugin.$element);
                }
            });
        },

        replaceContent: function (data) {
            var plugin = this;
            var content = $('<div></div>').html(data);
            var title = content.find('title');
            if (title.length) {
                this.popover.find('.popover-title').text(title.text());
                title.remove();
            }
            this.popover.find('.popover-content').html(content);
            content.find('form').submit(function () {
                return plugin.submit.call(plugin, $(this));
            });
            if (this.settings.onChange) {
                this.settings.onChange(content);
            }
        },

        submit: function (form) {
            if (this.isLoading) {
                return false;
            }
            this.isLoading = true;

            var data = new FormData(form[0]);
            var clicked = form.find(':submit[data-clicked]');
            if (clicked.length) {
                data.append(clicked.attr('name'), clicked.val());
            }

            var plugin = this;
            $.ajax({
                url: this.url,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST'
            }).done(function (data, textStatus, response) {
                if (response.status == 204 || response.getResponseHeader('X-Close') == 'true') {
                    plugin.$element.popover('destroy');
                    if (plugin.deactivateButton) {
                        plugin.$element.removeClass('active');
                    }
                    if (plugin.settings.onSuccess) {
                        plugin.settings.onSuccess(data, response, plugin.$element);
                    }
                } else {
                    plugin.replaceContent.call(plugin, data);
                }
                plugin.isLoading = false;
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError(response, plugin.$element);
                }
            });
            return false;
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new YPopover(this, options));
            }
        });
    };

})(jQuery, window, document);