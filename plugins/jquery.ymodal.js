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

    var pluginName = "yModal",
        defaults = {
            container: 'body',
            dialogClass: '',
            keyboard: true,
            template: '<div class="modal fade" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h2 class="modal-title"></h2></div><div class="modal-body"></div></div></div></div>',
            onChange: undefined,
            onSuccess: undefined,
            onError: undefined
        };

    function YModal(element, options) {
        this.element = element;
        this.$element = $(element);
        this.url = this.$element.attr('href');
        this.settings = $.extend({}, defaults, options);
        this.isLoading = false;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(YModal.prototype, {
        init: function () {
            var plugin = this;
            plugin.$element.off('click', null, plugin.click);
            plugin.click = function (e) {
                plugin.modal.modal('show');
                e.preventDefault();
            };
            this.$element.one('click', function (e) {
                plugin.modal = $(plugin.settings.template);
                plugin.modal.find('.modal-dialog').addClass(plugin.$element.data('modal-class') || plugin.settings.dialogClass);
                plugin.modal.data('yModal', plugin);

                plugin.load();

                var container = $(plugin.settings.container);
                container.prepend(plugin.modal);
                plugin.modal.modal({
                    show: true,
                    keyboard: plugin.settings.keyboard
                });
                e.preventDefault();
                plugin.$element.click(plugin.click);
                plugin.modal.on('hidden.bs.modal', function () {
                    plugin.init();
                    var modalToRemove = plugin.modal;
                    setTimeout(function () {
                        modalToRemove.remove();
                    }, 500);
                });
            });
        },

        load: function (url) {
            if (url) {
                this.url = url;
            }

            var options = {
                type: 'GET',
                url: this.url,
                headers: {'X-YMODAL': '1'}
            };
            var plugin = this;
            $.ajax(options).done(function (data, textStatus, response) {
                plugin.replaceContent.call(plugin, data, response);
                if (!plugin.$element.closest('.no-focus').length) {
                    plugin.modal.on('shown.bs.modal', function () {
                        plugin.modal.find(':input:not(:button):first').focus();
                    });
                }
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError.call(plugin, response);
                } else {
                    plugin.replaceContent.call(plugin, response.responseText, response);
                }
            });
        },

        replaceContent: function (data, response) {
            var plugin = this;
            var content = $('<div></div>').html(data);
            var title = content.find('title');
            if (title.length) {
                this.modal.find('.modal-title').text(title.text());
                title.remove();
            }
            this.modal.find('.modal-body').html(content);
            content.find('form').submit(function () {
                return plugin.submit.call(plugin, $(this));
            });
            content.find('[data-modal-close]').click(function () {
                plugin.close.call(plugin, $(this).data('modal-close'));
            });
            content.find('a[href]:not([data-modal-close]):not([data-action]):not([data-no-ajax]):not([target])').click(function () {
                var $link = $(this);
                plugin.load.call(plugin, $link.attr('href'));
                return false;
            });
            if (this.settings.onChange) {
                this.settings.onChange.call(plugin, content, response);
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
                headers: {'X-YMODAL': '1'}
            };

            this.$element.find(':submit').prop('disabled', true);

            var clicked = form.find(':submit[data-clicked]');
            if (window.FormData === undefined) {
                options.data = form.serializeArray();
                if (clicked.length) {
                    options.data.push({name: clicked.attr('name'), value: clicked.val()});
                }
            } else {
                options.processData = false;
                options.contentType = false;
                options.data = new FormData(form[0]);
                if (clicked.length) {
                    options.data.append(clicked.attr('name'), clicked.val());
                }
            }

            var plugin = this;
            $.ajax(options).done(function (data, textStatus, response) {
                if (response.status == 204 || response.getResponseHeader('X-Close') == 'true') {
                    plugin.close.call(plugin, data, response);
                } else {
                    plugin.replaceContent.call(plugin, data, response);
                }
                plugin.isLoading = false;
            }).fail(function (response) {
                if (plugin.settings.onError) {
                    plugin.settings.onError.call(plugin, response);
                } else {
                    plugin.replaceContent.call(plugin, response.responseText, response);
                }
            });
            return false;
        },

        close: function (data, response) {
            this.modal.modal('hide');
            if (this.settings.onSuccess) {
                this.settings.onSuccess.call(this, data, response);
            }
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new YModal(this, options));
            }
        });
    };

}));
