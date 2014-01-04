        $(document).ready(function() {
            
            //Keep the original div height for restoration purpose 
            var pozz_height = $('.product-container').height();
            
            
            /*  Expand/Collapse for each listing */
            $('.product-info-description').click(function() {
                var id = $(this).attr("id").replace("text-", "");
                var offset = parseInt($('.product-info-description').css("padding-top")) + parseInt($('.product-container').css("border-bottom-width"));
                if($('#' + id).height() == pozz_height) {
                    /* Show overflow content if there are any */
                    $('#overflow-' + id).css("display", "inline");
                    $('#overflow-placeholder-' + id).html("");
                    /* Expand listing container's height */
                    var default_height = $('#description-' + id).height();
                    var new_height = default_height + offset;
                    $('#' + id).animate({height:new_height}, 300);

                } else if($('#' + id).height() > pozz_height){  
                    /* Restore the original listing height */
                    var offset_height = pozz_height + offset;
                    
                    /* Perform animation */
                    $('#' + id).animate({height:offset_height}, 300, function() {
                        /* Hide overflow content */
                        $('#overflow-' + id).css("display", "none");
                        $('#overflow-placeholder-' + id).html("...");
                    });
                    
                }
            });

        });