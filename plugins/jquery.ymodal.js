;(function ($, window, document, undefined) {
    "use strict";

    var pluginName = "yModal",
        defaults = {
            container: 'body',
            dialogClass: '',
            template: '<div class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h2 class="modal-title"></h2></div><div class="modal-body"></div></div></div></div>',
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
                plugin.modal.find('.modal-dialog').addClass(plugin.settings.dialogClass);
                $.get(plugin.$element.attr('href'), function (data) {
                    plugin.replaceContent.call(plugin, data);
                });

                var container = $(plugin.settings.container);
                container.prepend(plugin.modal);
                plugin.modal.modal({
                    show: true,
                    keyboard: false
                });
                e.preventDefault();
                plugin.$element.click(plugin.click);
                plugin.modal.on('hidden.bs.modal', function () {
                    plugin.init();
                    setTimeout(function () {
                        plugin.modal.remove();
                    }, 500);
                });
            });
        },

        replaceContent: function (data) {
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
                    plugin.modal.modal('hide');
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
                $.data(this, "plugin_" + pluginName, new YModal(this, options));
            }
        });
    };

})(jQuery, window, document);