/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2020 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

define('views/import/step1', ['view', 'model'], function (Dep, Model) {

    return Dep.extend({

        template: 'import/step-1',

        events: {
            'change #import-file': function (e) {
                var $file = $(e.currentTarget);
                var files = e.currentTarget.files;
                if (files.length) {
                    this.loadFile(files[0]);
                }
            },

            'change #import-field-delimiter': function (e) {
                this.formData.delimiter = e.currentTarget.value;
                this.preview();
            },

            'change #import-text-qualifier': function (e) {
                this.formData.textQualifier = e.currentTarget.value;
                this.preview();
            },

            'click button[data-action="next"]': function () {
                this.next();
            }
        },

        getEntityList: function () {
            var list = [];
            var scopes = this.getMetadata().get('scopes');
            for (var scopeName in scopes) {
                if (scopes[scopeName].importable) {
                    if (!this.getAcl().checkScope(scopeName, 'create')) continue;
                    list.push(scopeName);
                }
            }
            list.sort(function (v1, v2) {
                 return this.translate(v1, 'scopeNamesPlural').localeCompare(this.translate(v2, 'scopeNamesPlural'));
            }.bind(this));

            return list;
        },

        data: function () {
            var entityList = this.getEntityList();

            return {
                entityList: entityList,
                currencyList: this.getConfig().get('currencyList'),
                dateFormatDataList: [
                    {key: "YYYY-MM-DD", value: '2017-12-27'},
                    {key: "DD-MM-YYYY", value: '27-12-2017'},
                    {key: "MM-DD-YYYY", value: '12-27-2017'},
                    {key: "MM/DD/YYYY", value: '12/27/2017'},
                    {key: "DD/MM/YYYY", value: '27/12/2017'},
                    {key: "DD.MM.YYYY", value: '27.12.2017'},
                    {key: "MM.DD.YYYY", value: '12.27.2017'},
                    {key: "YYYY.MM.DD", value: '2017.12.27'}
                ],
                timeFormatDataList: [
                    {key: "HH:mm:ss", value: '23:00:00'},
                    {key: "HH:mm", value: '23:00'},
                    {key: "hh:mm a", value: '11:00 pm'},
                    {key: "hh:mma", value: '11:00pm'},
                    {key: "hh:mm A", value: '11:00 PM'},
                    {key: "hh:mmA", value: '11:00PM'},
                    {key: "hh:mm:ss a", value: '11:00:00 pm'},
                    {key: "hh:mm:ssa", value: '11:00:00pm'},
                    {key: "hh:mm:ss A", value: '11:00:00 PM'},
                    {key: "hh:mm:ssA", value: '11:00:00PM'},
                ],
                timezoneList: this.getMetadata().get(['entityDefs', 'Settings', 'fields', 'timeZone', 'options']),

                personNameFormatList: this.personNameFormatList,
            };
        },

        setup: function () {
            this.formData = this.options.formData || {
                entityType: this.options.entityType || false,
                headerRow: true,
                delimiter: ',',
                textQualifier: '"',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm:ss',
                timezone: 'UTC',
                decimalMark: '.',
                personNameFormat: 'f l',
                idleMode: false,
                skipDuplicateChecking: false,
                silentMode: true,
            };

            this.personNameFormatList = [
                'f l',
                'l f',
                'l, f',
            ];

            var personNameFormat = this.getConfig().get('personNameFormat') || 'firstLast';
            if (~personNameFormat.toString().toLowerCase().indexOf('middle')) {
                this.personNameFormatList.push('f m l');
                this.personNameFormatList.push('l f m');
            }

            var model = this.model = new Model;

            model.set({
                silentMode: this.formData.silentMode,
                idleMode: this.formData.idleMode,
                skipDuplicateChecking: this.formData.skipDuplicateChecking,
            });

            this.createView('silentModeField', 'views/fields/bool', {
                el: this.getSelector() + ' .field[data-name="silentMode"]',
                model: this.model,
                name: 'silentMode',
                mode: 'edit',
                tooltip: true,
                tooltipText: this.translate('silentMode', 'tooltips', 'Import'),
            });
            this.createView('idleModeField', 'views/fields/bool', {
                el: this.getSelector() + ' .field[data-name="idleMode"]',
                model: this.model,
                name: 'idleMode',
                mode: 'edit',
            });
            this.createView('skipDuplicateCheckingField', 'views/fields/bool', {
                el: this.getSelector() + ' .field[data-name="skipDuplicateChecking"]',
                model: this.model,
                name: 'skipDuplicateChecking',
                mode: 'edit',
            });
        },

        afterRender: function () {
            this.setupFormData();
            if (this.getParentView() && this.getParentView().fileContents) {
                this.setFileIsLoaded();
                this.preview();
            }
        },

        next: function () {
            this.formData.headerRow = $('#import-header-row').get(0).checked;
            this.formData.entityType = $('#import-entity-type').val();
            this.formData.action = $('#import-action').val();
            this.formData.delimiter = $('#import-field-delimiter').val();
            this.formData.textQualifier = $('#import-text-qualifier').val();
            this.formData.dateFormat = $('#import-date-format').val();
            this.formData.timeFormat = $('#import-time-format').val();
            this.formData.timezone = $('#import-timezone').val();
            this.formData.decimalMark = $('#import-decimal-mark').val();
            this.formData.currency = $('#import-currency').val();
            this.formData.personNameFormat = $('#import-person-name-format').val();

            this.getView('silentModeField').fetchToModel();
            this.getView('idleModeField').fetchToModel();
            this.getView('skipDuplicateCheckingField').fetchToModel();

            this.formData.silentMode = this.model.get('silentMode');
            this.formData.idleMode = this.model.get('idleMode');
            this.formData.skipDuplicateChecking = this.model.get('skipDuplicateChecking');

            this.getParentView().formData = this.formData;

            this.getParentView().trigger('change');

            this.getParentView().changeStep(2);
        },

        setupFormData: function () {
            this.model.set('silentMode', this.formData.silentMode);
            this.model.set('idleMode', this.formData.idleMode);
            this.model.set('skipDuplicateChecking', this.formData.skipDuplicateChecking);

            $('#import-header-row').get(0).checked = this.formData.headerRow || false;

            if (this.formData.entityType) {
                $('#import-entity-type').val(this.formData.entityType);
            }
            if (this.formData.action) {
                $('#import-action').val(this.formData.action);
            }

            $('#import-field-delimiter').val(this.formData.delimiter);
            $('#import-text-qualifier').val(this.formData.textQualifier);
            $('#import-date-format').val(this.formData.dateFormat);
            $('#import-time-format').val(this.formData.timeFormat);
            $('#import-timezone').val(this.formData.timezone);
            $('#import-decimal-mark').val(this.formData.decimalMark);
            $('#import-person-name-format').val(this.formData.personNameFormat);

            if (this.formData.currency) {
                $('#import-currency').val(this.formData.currency);
            } else {
                $('#import-currency').val(this.getConfig().get('defaultCurrency'));
            }
        },

        loadFile: function (file) {
            var blob = file.slice(0, 1024 * 16);

            var readerPreview = new FileReader();
            readerPreview.onloadend = function (e) {
                if (e.target.readyState == FileReader.DONE) {
                    this.formData.previewString = e.target.result;
                    this.preview();
                }
            }.bind(this);
            readerPreview.readAsText(blob);

            var reader = new FileReader();
            reader.onloadend = function (e) {
                if (e.target.readyState == FileReader.DONE) {
                    this.getParentView().fileContents = e.target.result;
                    this.setFileIsLoaded();
                }
            }.bind(this);
            reader.readAsText(file);
        },

        setFileIsLoaded: function () {
            this.$el.find('button[data-action="next"]').removeClass('hidden');
        },

        preview: function () {
            if (!this.formData.previewString) {
                return;
            }
            var arr = this.csvToArray(this.formData.previewString, this.formData.delimiter, this.formData.textQualifier);

            this.formData.previewArray = arr;

            var $table = $('<table>').addClass('table').addClass('table-bordered');

            arr.forEach(function (row, i) {
                if (i >= 3) {
                    return;
                }
                $row = $('<tr>');
                row.forEach(function (value) {
                    $cell = $('<td>').html(value);
                    $row.append($cell);
                });

                $table.append($row);
            });

            var $container = $('#import-preview');
            $container.empty().append($table);
        },

        csvToArray: function (strData, strDelimiter, strQualifier) {
            strDelimiter = (strDelimiter || ',');
            strQualifier = (strQualifier || '\"');

            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:"+strQualifier+"([^"+strQualifier+"]*(?:"+strQualifier+""+strQualifier+"[^"+strQualifier+"]*)*)"+strQualifier+"|" +

                    // Standard fields.
                    "([^"+strQualifier+"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
            );

            var arrData = [[]];
            var arrMatches = null;

            while (arrMatches = objPattern.exec(strData)) {
                var strMatchedDelimiter = arrMatches[1];

                if (
                    strMatchedDelimiter.length &&
                    (strMatchedDelimiter != strDelimiter)
                    ) {
                    arrData.push([]);
                }

                if (arrMatches[2]) {
                    var strMatchedValue = arrMatches[2].replace(
                            new RegExp( "\"\"", "g" ),
                            "\""
                        );
                } else {
                    var strMatchedValue = arrMatches[3];
                }

                arrData[arrData.length - 1].push(strMatchedValue);
            }

            return arrData;
        },

    });
});
