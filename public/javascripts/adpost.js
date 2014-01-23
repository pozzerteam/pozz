

$(document).ready(function () {
    var steps = ["What is the value of your item? (1/3)", "Describe it for me? (2/3)", "When and where can I see it? (3/3)"];
    var postInputTitle1 = ["Title", "Description", "Dates"];
    var postInputTitle2 = ["Price", "Images", "Location"];
    var stepIndex = 0;
    

    $('#poststep').html(steps[stepIndex]);

    $('.post-box').hide();

    $("#prevButton").hide();

    $('#post-button').click(function () {
        $('.post-box').toggle();
    });

    $('#prevButton').click(function () {
        if (stepIndex == steps.length) {
            stepIndex -= 1;
        }
        if (stepIndex == 1) {
            $(this).hide();
        }
        if ($('#poststep').html() === steps[stepIndex]) {
            stepIndex -= 1;
            $('#poststep').html(steps[stepIndex]);
            $('#postinput-title1').html(postInputTitle1[stepIndex]);
            $('#postinput-title2').html(postInputTitle2[stepIndex]);
            nextStep(stepIndex);
        }
    });

    $('#nextButton').click(function () {
        if (stepIndex < 0) {
            stepIndex = 0;
        }
        if (!$("#prevButton").is(":visible")) {
            $('#prevButton').show();
        }
        if (stepIndex < steps.length) {
            stepIndex += 1;
            $('#poststep').html(steps[stepIndex]);
            $('#postinput-title1').html(postInputTitle1[stepIndex]);
            $('#postinput-title2').html(postInputTitle2[stepIndex]);
            nextStep(stepIndex);

        }
    });

});

function nextStep(step) {
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var days_abbr = ["M", "T", "W", "Th", "F", "Sa", "Sun"];
    switch (step) {

        //Step 1 - Title, Price
    case 0:
        $("#input-1").html("").append('<input type="text" class="form-control" placeholder="$1200 Macbook air OBO" id="titlepost">').ready(function () {
            $('#titlepost').on("keyup", function () {
                console.log($(this).val());
            });
        });
        $("#input-2").html('<input type="text" placeholder="1200" id="pricetosell" class="form-control">').ready(function () {
            $('#pricetosell').on("keyup", function () {
                console.log($(this).val());
            });
        });
        break;
        //Step 2 - Description, Images
    case 1:
        $('#input-1').html("<textarea cols=20 rows=6 id='descriptionofitem' class='form-control' placeholder='I am selling my rarely used macbook air...'>").ready(function () {
            $('#descriptionofitem').on("keyup", function () {
                console.log($(this).val());
            });
        });
        $('#input-2').html("").append('<span class="btn btn-success fileinput-button"><i class="glyphicon glyphicon-plus"></i><span>Add files...</span><input type="file" id="fileupload" name="files[]" multiple></span><div id="progress" class="progress"><div class="progress-bar progress-bar-success"></div></div><!-- The container for the uploaded files --><div id="files" class="files"></div>').ready(function () {
            var url = "http://localhost:3000/uploadimg",
                uploadButton = $('<button/>')
                    .addClass('btn btn-primary')
                    .prop('disabled', true)
                    .text('Processing...')
                    .on('click', function () {
                        var $this = $(this),
                            data = $this.data();
                        $this
                            .off('click')
                            .text('Abort')
                            .on('click', function () {
                                $this.remove();
                                data.abort();
                            });
                        data.submit().always(function () {
                            $this.remove();
                        });
                    });

            $('#fileupload').fileupload({
                url: "http://localhost:3000/uploadimg",
                dataType: 'json',
                autoUpload: false,
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                maxFileSize: 5000000, // 5 MB
                // Enable image resizing, except for Android and Opera,
                // which actually support image resizing, but fail to
                // send Blob objects via XHR requests:
                disableImageResize: /Android(?!.*Chrome)|Opera/
                    .test(window.navigator.userAgent),
                previewMaxWidth: 100,
                previewMaxHeight: 100,
                previewCrop: true
            }).on('fileuploadadd', function (e, data) {
                data.context = $('<div/>').appendTo('#files');
                $.each(data.files, function (index, file) {
                    var node = $('<p/>')
                        .append($('<span/>').text(file.name));
                    if (!index) {
                        node
                            .append('<br>')
                            .append(uploadButton.clone(true).data(data));
                    }
                    node.appendTo(data.context);
                });
            }).on('fileuploadprocessalways', function (e, data) {
                var index = data.index,
                    file = data.files[index],
                    node = $(data.context.children()[index]);
                if (file.preview) {
                    node
                        .prepend('<br>')
                        .prepend(file.preview);
                }
                if (file.error) {
                    node
                        .append('<br>')
                        .append($('<span class="text-danger"/>').text(file.error));
                }
                if (index + 1 === data.files.length) {
                    data.context.find('button')
                        .text('Upload')
                        .prop('disabled', !! data.files.error);
                }
            }).on('fileuploadprogressall', function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }).on('fileuploaddone', function (e, data) {
                $.each(data.result.files, function (index, file) {
                    if (file.url) {
                        var link = $('<a>')
                            .attr('target', '_blank')
                            .prop('href', file.url);
                        $(data.context.children()[index])
                            .wrap(link);
                    } else if (file.error) {
                        var error = $('<span class="text-danger"/>').text(file.error);
                        $(data.context.children()[index])
                            .append('<br>')
                            .append(error);
                    }
                });
            }).on('fileuploadfail', function (e, data) {
                $.each(data.files, function (index, file) {
                    var error = $('<span class="text-danger"/>').text('File upload failed.');
                    $(data.context.children()[index])
                        .append('<br>')
                        .append(error);
                });
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');
        });
        break;

        //Step 3 - Dates, Location
    case 2:
        var myDay = '<div id="selectedDays" style:"display:table-cell; overflow:auto;"></div>';
        for (var i = 0; i < days.length; i++) {
            myDay += "<button type='button' class='btn btn-default day' value='" + days[i] + "'>" + days_abbr[i] + "</button>";
        }
        //Dynamically add html elements to input-1 with events callback
        $("#input-1").html("").append(myDay).ready(function () {
            $('.day').on("click", function () {
                if ($(this).hasClass("btn-default")) {
                    $(this).removeClass("btn-default").addClass("btn-primary");
                } else {
                    $(this).removeClass("btn-primary").addClass("btn-default");
                }
                //Iterate through every day class element
                var selected = "<b>Selected:</b> ";
                $('.day').each(function (i, obj) {
                    if ($(this).hasClass("btn-primary")) {
                        selected += $(this).val() + ",";
                    }
                });
                selected = selected.substring(0, selected.length - 1);
                $('#selectedDays').html("").append(selected);
                //                           $('#selectedDays').append(selected);
            });
        });
        //Dynamicall generate location input with function callback
        $('#input-2').html("");
        $('#input-2').append('<input type="text" id="placetosee" placeholder="Seattle, WA" class="form-control">').ready(function () {
            $('#placetosee').on("keyup", function () {
                console.log($(this).val());
            });
        });
        break;

    default:
        break;
    }
}