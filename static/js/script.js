(function ($) {
    "use strict";


    /*=====================
      01. Tooltip js
      ==========================*/
    tippy('.sidebar-main .icon-btn', {
        theme: 'tooltiprad',
        placement: 'right-end',
        arrow: false
    });
    tippy('.user-popup', {
        content: "Status",
        theme: 'gradienttooltip',
        placement: 'right-end',
        arrow: false
    });
    tippy('.calls  > li > .icon-btn', {
        placement: 'bottom-end',
        arrow: true
    });
    tippy('.clfooter a', {
        placement: 'top-end',
        arrow: true
    });
    tippy('.audiocall2 a', {
        placement: 'top-end',
        arrow: true
    });
    tippy('.videocall a', {
        placement: 'top-end',
        arrow: true
    });

    /*=====================
      02. Background Image js
      ==========================*/
    $(".bg-top").parent().addClass('b-top');
    $(".bg-bottom").parent().addClass('b-bottom');
    $(".bg-center").parent().addClass('b-center');
    $(".bg_size_content").parent().addClass('b_size_content');
    $(".bg-img").parent().addClass('bg-size');
    $('.bg-img').each(function () {
        var el = $(this),
            src = el.attr('src'),
            parent = el.parent();
        parent.css({
            'background-image': 'url(' + src + ')',
            'background-size': 'cover',
            'background-position': 'center',
            'display': 'block'
        });
        el.hide();
    });


    /*=====================
         05. Search js
         ==========================*/
    $('.search').on('click', function (e) {
        $(this).siblings().toggleClass("open");
    });
    $('.close-search').on('click', function (e) {
        $(this).parent().parent().removeClass("open");
    });
    $('.search-right').on('click', function (e) {
        $(this).parent().parent().parent().parent().parent().parent().find(".form-inline").toggleClass("open");
    });
    $('.close-search').on('click', function (e) {
        $(this).parent().parent().removeClass("open");
    });

    /*=====================
         06. Mute js
         ==========================*/
    $('.mute').on('click', function (e) {
        $(this).children().toggleClass("off");
    });

    /*=====================
         07. Button Effect js
         ==========================*/
    $('.button-effect').on('click', function (e) {
        e.preventDefault();
        var self = $(this),
            wave = '.effect-wave',
            btnWidth = self.outerWidth(),
            x = e.offsetX,
            y = e.offsetY;
        self.prepend('<span class="effect-wave"></span>')
        $(wave)
            .css({
                'top': y,
                'left': x
            })
            .animate({
                opacity: '0',
                width: btnWidth * 2,
                height: btnWidth * 2
            }, 500, function () {
                self.find(wave).remove()
            })
    })

    /*=====================
         08. Collapse Title js
         ==========================*/
    $('.block-title').on('click', function (e) {
        e.preventDefault;
        var speed = 300;
        var thisItem = $(this).parent(),
            nextLevel = $(this).next('.block-content');
        if (thisItem.hasClass('open')) {
            thisItem.removeClass('open');
            nextLevel.slideUp(speed);
        } else {
            thisItem.addClass('open');
            nextLevel.slideDown(speed);
        }
    });

    /*=====================
         09. Refresh Request information next & previous button
         ==========================*/
    $('.refresh').on('click', function (e) {
        $(this).toggleClass('refreshed');
    });
    $('.req-info').on('click', function (e) {
        $(this).addClass('disabled');
    });
    $('.next').on('click', function (e) {
        $(this).parent().parent().siblings().addClass('open');
    });
    $('.previous').on('click', function (e) {
        $(this).parent().parent().parent().removeClass('open');
    });

    $('.chat-cont-toggle').on('click', function (e) {
        $('.chat-cont-setting ').toggleClass('open');
    });


    /*=====================
          10 .Full Screen
          ==========================*/

    $('.toggle-full-screen').on('click', function (e) {
        $('#videocall').toggleClass("active");
    })


    /*=====================
           13. Customizer
           ==========================*/
    $('.cog-click').on('click', function () {
        $('.setting-sidebar').css("right", "0px");
    });
    $(".cog-close").on('click', function () {
        $('.setting-sidebar').css("right", "-400px");
    });
    $(".theme-layout li").on('click', function () {
        $(".theme-layout li").removeClass('active');
        $(this).addClass("active");
        var themeLayout = $(this).attr("data-attr");
        $("body").attr("class", themeLayout);
    });
    var body_event = $("body");
    body_event.on("click", ".rtl-setting", function () {
        $(this).toggleClass('rtl');
        $('body').removeClass('rtl');
        if ($('.rtl-setting').hasClass('rtl')) {
            $('.rtl-setting').text('LTR');
            $('body').addClass('rtl');
        } else {
            $('.rtl-setting').text('RTL');
        }
        return false;
    });
    body_event.on("click", ".themes-content li", function () {
        $(this).addClass('active').siblings().removeClass('active');
        $color = $(this).attr("data-attr");
        $("#color").attr("href", "../assets/css/" + $color + ".css");
        return false;
    });

    /*=====================
    14 footer responsive js
    ==========================*/
    var contentwidth = jQuery(window).width();
    if ((contentwidth) < '768') {
        jQuery('.footer-title h3').append('<span class="according-menu"></span>');
        jQuery('.footer-title').on('click', function () {
            jQuery('.footer-title').removeClass('active');
            jQuery('.footer-contant').slideUp('normal');
            if (jQuery(this).next().is(':hidden') == true) {
                jQuery(this).addClass('active');
                jQuery(this).next().slideDown('normal');
            }
        });
        jQuery('.footer-contant').hide();
    } else {
        jQuery('.footer-contant').show();
    }
    /*=====================
        15. Pin box
        ==========================*/
    $('.ti-pin2').on('click', function () {
        $(this).parent().parent().parent().toggleClass('pined');
    });


    /*=====================
        17 set wallpaper onclick
        ==========================*/
    $('.wallpaper li.bg-color').on('click', function () {
        var color = $(this).css('background-image');
        $(".wallpaper li").removeClass('active');
        $(this).addClass("active");
        $(".chitchat-main .messages").css({
            'background-image': color,
            'background-blend-mode': 'unset',
        });
    });
    $('.wallpaper li.bg-size').on('click', function () {
        var color = $(this).children(".bg-img").attr('src');
        $(".wallpaper li").removeClass('active');
        $(this).addClass("active");
        $(".chitchat-main .messages").css({
            'background-image': 'url(' + color + ')',
            'background-color': 'transparent'
        });
    });

    /*=====================
        18 custom tab
        ==========================*/
    $(".contact-log-main li , .call-log-main li").on('click', function () {
        $(this).parent().find("li").removeClass("active");
        $(this).addClass("active");
    });

    $(".sidebar-top  a").on('click', function () {
        $(".sidebar-top  a").removeClass("active");
        $(this).addClass("active");
        $('.dynemic-sidebar').removeClass("active");
        var active_class = $(this).attr("href");
        $('#' + active_class).addClass("active");
    });


    /*=====================
      22. toggle classes
      ==========================*/
    $('.mobile-sidebar').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
    });
    $('.chat-main .chat-box').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
    });
    $('.group-main .group-box').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
    });
    $('.call-log-main .call-box').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
    });
    $('.contact-log-main .contact-box').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
    });

    $('.mobile-back').on('click', function () {
        $('.chitchat-container').toggleClass("mobile-menu");
        $('.main-nav').removeClass("on");
    });


    $('.chat-friend-toggle').on('click', function () {
        $('.chat-frind-content').toggle();
    });

    $('.gr-chat-friend-toggle').on('click', function () {
        $('.gr-chat-frind-content').toggle();
    });
    $('.msg-setting').on('click', function () {
        $(this).siblings('.msg-dropdown').toggle();
    });
    $(".favourite").on('click', function () {
        $(this).toggleClass("btn-outline-primary").toggleClass("btn-primary");
    });
    $(".edit-btn").on('click', function () {
        $(this).parent().parent().toggleClass("open");
    });


    /*=====================
           24. right sidebar
           ==========================*/
    $(".app-list-ul  a").on('click', function () {
        $(".app-list-ul  a").removeClass("active");
        if ($(window).width() >= 1500) {
            $(".chitchat-main").removeClass("small-sidebar");
        }
        $(this).addClass("active");
        $('.apps-ul li').removeClass("active");
        var active_class = $(this).attr("href");
        $('#' + active_class).addClass("active");
    });

    $('.apps-toggle').on('click', function () {
        if (!$('body').hasClass('sidebar-active main-page menu-active'))
            $('body').toggleClass('sidebar-active main-page');
        $('body').removeClass('menu-active');
        $('.app-sidebar').toggleClass('active');
        $('.chitchat-main').toggleClass("small-sidebar");
    });


    /*=====================
           28. dropdown
           ==========================*/

    $('.dropdown').click(function () {
        $(this).attr('tabindex', 1).focus();
        $(this).toggleClass('active');
        $(this).find('.dropdown-menu').slideToggle(300);
    });
    $('.dropdown').focusout(function () {
        $(this).removeClass('active');
        $(this).find('.dropdown-menu').slideUp(300);
    });
    $('.dropdown .dropdown-menu li').click(function () {
        $(this).parents('.dropdown').find('span').text($(this).text());
        $(this).parents('.dropdown').find('input').attr('value', $(this).attr('id'));
    });

    /*=====================
        29. Sidebar setting
        ==========================*/

    $(".sidebar-setting .two-column").on('click', function () {
        $(".sidebar-setting li").removeClass('active');
        $(this).addClass("active");
        $('.theme-title .icon-btn').removeClass("btn-outline-light").removeClass("btn-outline-primary");
        $('.main-nav').removeClass("on");
    });
    $(".sidebar-setting .three-column").on('click', function () {
        $(".sidebar-setting li").removeClass('active');
        $(this).addClass("active");
        $('.theme-title .icon-btn').addClass("btn-outline-light").addClass("btn-outline-primary");
        $('.main-nav').addClass("on");
    });


    /*=====================
       25. Sticker
       ==========================*/
    $('.sticker-contain ul li').on('click', function (e) {
        var sticker = $(this).children().html();
        $('<li class="replies"> <div class="media"> <div class="profile mr-4 bg-size" style="background-image: url("../assets/images/contact/1.jpg"); background-size: cover; background-position: center center;"></div><div class="media-body"> <div class="contact-name"> <h5>Alan josheph</h5> <h6>01:42 AM</h6> <ul class="msg-box"> <li> <h5>' + sticker + '</h5> </li></ul> </div></div></div></li>').appendTo($('.messages .chatappend'));
        $('.chat-main .active .details h6').html('<span>You : </span>' + sticker);
        var test = $(this).height();
        $(".messages").animate({

            scrollTop: $(document).height()
        }, "fast");
        $(".sticker-contain").removeClass("open");
        $(".toggle-sticker").removeClass("active");
    });

    // Toggle sticker
    $('.toggle-sticker').on('click', function () {
        $(this).toggleClass("active");
        $('.sticker-contain').toggleClass("open");
        $('.emojis-contain').removeClass("open");
        $(".toggle-emoji").removeClass("active");
        $('.contact-poll-content').css('display', 'none');
    });

    // Toggle emoji
    $('.toggle-emoji').on('click', function (e) {
        e.stopPropagation();
        $(this).toggleClass("active");
        $('.emojis-contain').toggleClass("open");
        $(".sticker-contain").removeClass("open");
        $(".toggle-sticker").removeClass("active");
        $('.contact-poll-content').css('display', 'none');
    });

    // Toggle poll
    $('.contact-poll').on('click', function (e) {
        $('.contact-poll-content').toggle();
        $('.emojis-contain').removeClass("open");
        $(".toggle-emoji, .toggle-sticker").removeClass("active");
    });

    // Outside click
    $(document).on('click', function (e) {
        var outside_space = $(".outside");
        if (!outside_space.is(e.target) &&
            outside_space.has(e.target).length === 0) {
            $(".sticker-contain").removeClass("open");
            $(".emojis-contain").removeClass("open");
            $(".toggle-emoji, .toggle-sticker").removeClass("active");
            $('.contact-poll-content').css('display', 'none');
            $('.chat-frind-content').css('display', 'none');
        }
    })

    $(".mode").on("click", function () {
        $('.mode i').toggleClass("fa-moon-o").toggleClass("fa-lightbulb-o");
        $('body').toggleClass("dark");
    });
    $(".mainnav").on("click", function () {
        $('.theme-title .icon-btn').toggleClass("btn-outline-light").toggleClass("btn-outline-primary");
        $('.main-nav').toggleClass("on");
    });

    $(".close-apps").on("click", function () {
        $('.apps-ul li').removeClass("active");
        $('.chitchat-main').addClass("small-sidebar");
    });

    $(".close-app").on("click", function () {
        $('body').removeClass("sidebar-active");
        $('.app-sidebar').removeClass("active");
    });

    $(".close-panel").on("click", function () {
        $('.dynemic-sidebar, .button-effect.active, sidebar-top .sidebar-top > li > a').removeClass("active");
        $('.recent-default').addClass("active");
    });


    if ($(window).width() <= 992) {
        $(".main-nav").removeClass("on");
        $('body').removeClass("sidebar-active");
        $('.app-sidebar').removeClass("active");
        $('.chitchat-main').removeClass("small-sidebar");
    }

    if ($(window).width() <= 800) {
        $("ul.chat-main  li").on('click', function () {
            $('.main-nav').removeClass("on");
        });
    }

    /*=====================
    02 . calling timer js
    ==========================*/
    var timer = new Timer();
    timer.start();
    timer.addEventListener('secondsUpdated', function (e) {
        $('#basicUsage').html(timer.getTimeValues().toString());
    });
    timer.addEventListener('secondsUpdated', function (e) {
        $('#basicUsage3').html(timer.getTimeValues().toString());
    });
    timer.addEventListener('secondsUpdated', function (e) {
        $('#basicUsage2').html(timer.getTimeValues().toString());
    });

})(jQuery);


function toggleFullScreen() {
    $('#videocall').toggleClass("active");
}

function removedefault() {
    $('body').removeClass("sidebar-active");
    $('.app-sidebar').removeClass("active");
}
