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

    var pluginName = "yPopover",
        defaults = {
            container: 'body',
            viewport: {selector: 'body', padding: 10},
            popoverClass: '',
            placement: 'right',
            data: undefined,
            template: undefined,
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

            var template = this.settings.template;
            if (!template) {
                var popoverClass = element.data('popover-class') || plugin.settings.popoverClass;
                template = '<div class="popover '+popoverClass+'"><div class="arrow"></div><button class="close" type="button">×</button><h3 class="popover-title"></h3><div class="popover-content"></div></div>';
            }

            element.popover({
                html: true,
                title: element.is('[data-title]') ? element.data('title') : element.text(),
                trigger: 'manual',
                placement: element.is('[data-placement]') ? element.data('placement') : this.settings.placement,
                template: template,
                container: this.settings.container,
                viewport: this.settings.viewport
            }).on('shown.bs.popover', function () {
                plugin.popover = element.data('bs.popover').$tip;
                var popover = plugin.popover;
                popover.data(pluginName, plugin);
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

            $.ajax({
                url: this.url,
                method: this.settings.data ? 'POST' : 'GET',
                headers: {'X-YPOPOVER': '1'},
                data: this.settings.data ? this.settings.data() : null
            }).done(function (data, textStatus, response) {
                if (response.status == 204 || response.getResponseHeader('X-Close') == 'true') {
                    plugin.close.call(plugin, data, response);

                    return;
                }

                plugin.replaceContent(data);
                if (!plugin.$element.closest('.no-focus').length) {
                    popover.find(':input:not(:button):first').focus();
                }
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError.call(plugin, response);
                } else {
                    plugin.replaceContent.call(plugin, response.responseText);
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
            content.find('[data-popover-close]').click(function () {
                plugin.close.call(plugin, $(this).data('popover-close'));
            });
            if (this.settings.onChange) {
                this.settings.onChange.call(plugin, content);
            }
        },

        submit: function (form) {
            if (this.isLoading) {
                return false;
            }
            this.isLoading = true;

            var options = {
                type: 'POST',
                url: this.url,
                cache: false,
                headers: {'X-YPOPOVER': '1'}
            };

            this.popover.find(':submit').prop('disabled', true);

            var clicked = form.find(':submit[data-clicked]');
            if (window.FormData === undefined) {
                options.data = form.serializeArray();
                if (clicked.length) {
                    options.data.push({name: clicked.attr('name'), value: clicked.val()});
                }
                if (this.settings.data) {
                    $.each(this.settings.data(), function (index, data) {
                        options.data.push(data);
                    })
                }
            } else {
                options.processData = false;
                options.contentType = false;
                options.data = new FormData(form[0]);
                if (clicked.length) {
                    options.data.append(clicked.attr('name'), clicked.val());
                }
                if (this.settings.data) {
                    $.each(this.settings.data(), function (index, data) {
                        options.data.append(data.name, data.value);
                    })
                }
            }

            var plugin = this;
            $.ajax(options).done(function (data, textStatus, response) {
                if (response.status == 204 || response.getResponseHeader('X-Close') == 'true') {
                    plugin.close.call(plugin, data, response);
                } else {
                    plugin.replaceContent.call(plugin, data);
                }
                plugin.isLoading = false;
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError.call(plugin, response);
                } else {
                    plugin.replaceContent.call(plugin, response.responseText);
                }
            });
            return false;
        },

        close: function (data, response) {
            this.$element.popover('destroy');
            if (this.deactivateButton) {
                this.$element.removeClass('active');
            }
            if (this.settings.onSuccess) {
                this.settings.onSuccess.call(this, data, response);
            }
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new YPopover(this, options));
            }
        });
    };

}));
