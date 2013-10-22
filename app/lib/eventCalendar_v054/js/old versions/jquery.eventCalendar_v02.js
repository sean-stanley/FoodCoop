// definición de la función
$.fn.eventCalendar = function(options){
	// puede recibir un array de parámetros nombrados
	// invocamos a una función genérica que hace el merge 
	// entre los recibidos y los de por defecto 
	eventsOpts = $.extend({}, $.fn.eventCalendar.defaults, options);
	
	var flags = {
		downloaded: false,
		wrap: "",
		directionLeftMove: "300",
		eventsJson: {}
	}
	
	// para cada componente que puede contener el objeto jQuery que invoca a esta función
	this.each(function(){
		flags.wrap = $(this);
		flags.wrap.addClass('eventCalendar-wrap')
				.append("<div id='eventsCalendar-list-wrap'><p class='eventsCalendar-subtitle'></p><span class='eventsCalendar-loading'>loading...</span><ul class='eventsCalendar-list'></ul></div>");
		
		flags.directionLeftMove = flags.wrap.width();
		
		// show current month
		dateSlider("current");
		
		getEvents(eventsOpts.eventsLimit,false,false,false,false);
		
		changeMonth();
		
		flags.wrap.find('.eventsCalendar-day a').live('click',function(e){
			e.preventDefault();
			var year = flags.wrap.attr('data-current-year'),
				month = flags.wrap.attr('data-current-month'),
				day = $(this).parent().attr('rel');
				
			getEvents(false, year, month,day, "day");
		});
		
		flags.wrap.find('.monthTitle').live('click',function(e){
			console.log(flags.wrap);
			e.preventDefault();
			var year = flags.wrap.attr('data-current-year'),
				month = flags.wrap.attr('data-current-month');
				
			getEvents(false, year, month,false, "month");
		})
	});
	
	function sortJson(a, b){  
		return a.date.toLowerCase() > b.date.toLowerCase() ? 1 : -1;  
	};

	function dateSlider(show, year, month) {
		var $eventsCalendarSlider = $("<div class='eventsCalendar-slider'></div>"),
			$eventsCalendarMonthWrap = $("<div class='eventsCalendar-monthWrap' style='width:"+flags.wrap.width()+"px'></div>"),
			$eventsCalendarTitle = $("<div class='eventsCalendar-currentTitle'><a href='#' class='monthTitle'></a></div>"),
			$eventsCalendarArrows = $("<a href='#' class='arrow prev'>" + eventsOpts.txt_prev + "</a><a href='#' class='arrow next'>" + eventsOpts.txt_next + "</a>");
			$eventsCalendarDaysList = $("<ul class='eventsCalendar-daysList'></ul>"),
			date = new Date();
		
		if (!flags.wrap.find('.eventsCalendar-slider').size()) {
			flags.wrap.prepend($eventsCalendarSlider);
			$eventsCalendarSlider.append($eventsCalendarMonthWrap);
		} else {
			flags.wrap.find('.eventsCalendar-slider').append($eventsCalendarMonthWrap);
		}
		
		flags.wrap.find('.eventsCalendar-monthWrap.currentMonth').removeClass('currentMonth').addClass('oldMonth');
		$eventsCalendarMonthWrap.addClass('currentMonth').append($eventsCalendarTitle, $eventsCalendarDaysList);
		
		
		
		// if current show current month & day 
		if (show === "current") {
			day = date.getDate();
			$eventsCalendarSlider.append($eventsCalendarArrows);	
			
		} else {
			date = new Date(flags.wrap.attr('data-current-year'),flags.wrap.attr('data-current-month'),1,0,0,0); // current visible month
			day = 0; // not show current day in days list				
				
			moveOfMonth = 1;
			if (show === "prev") {
				moveOfMonth = -1;
			}
			date.setMonth( date.getMonth() + moveOfMonth );			
			
			var tmpDate = new Date();
			if (date.getMonth() === tmpDate.getMonth()) {
				day = tmpDate.getDate();
			} 
			
		}
		
		// get date portions
		var year = date.getFullYear(),
			month = date.getMonth(), // 0-11
			monthToShow = month + 1;
		
		if (show != "current") {
			getEvents(false, year, month,false, show);
		}
		
		//console.log("dateSlider:  " + year + "/" + monthToShow + "/" + day);
		
		flags.wrap.attr('data-current-month',month)
			.attr('data-current-year',year);
			
		// add current date info
		$eventsCalendarTitle.find('.monthTitle').html(eventsOpts.monthNames[month] + " " + year);
		
		// print all month days
		var daysOnTheMonth = 32 - new Date(year, month, 32).getDate();
		var daysList = [];
		if (eventsOpts.showDayAsWeeks) {
			$eventsCalendarDaysList.addClass('showAsWeek');
			dt=new Date(year, month, 01);
			var weekDay = dt.getDay();
			if (eventsOpts.startWeekOnMonday) {
				weekDay = dt.getDay() - 1;
			}
			for (i = weekDay; i > 0; i--) {
				//console.log(i + " " + date.getDay());
				daysList.push('<li class="eventsCalendar-day empty"></li>');
			}
		}
		for (dayCount = 1; dayCount <= daysOnTheMonth; dayCount++) {
			var dayClass = "";
			
			if (day > 0 && dayCount === day) {
				dayClass = "current";
			}
			daysList.push('<li id="dayList_' + dayCount + '" rel="'+dayCount+'" class="eventsCalendar-day '+dayClass+'"><a href="#">' + dayCount + '</a></li>');
		}
		$eventsCalendarDaysList.append(daysList.join(''));
		
		$eventsCalendarSlider.css('height',$eventsCalendarMonthWrap.height()+'px');
	}

	function num_abbrev_str(num) {
		var len = num.length, last_char = num.charAt(len - 1), abbrev
		if (len === 2 && num.charAt(0) === '1') {
			abbrev = 'th'
		} else {
			if (last_char === '1') {
				abbrev = 'st'
			} else if (last_char === '2') {
				abbrev = 'nd'
			} else if (last_char === '3') {
				abbrev = 'rd'
			} else {
				abbrev = 'th'
			}
		}
		return num + abbrev
	}
	
	function getEvents(limit, year, month, day, direction) {
		var limit = limit || 0;
		var year = year || '';
		var month = month || '';
		var day = day || '';
		
		flags.wrap.find('.eventsCalendar-loading').fadeIn();
		
		if (!eventsOpts.cacheJson || !direction) {
			// first load: load json and save it to future filters
			flags.downloaded = true;
			$.getJSON(eventsOpts.eventsjson + "?limit="+limit+"&year="+year+"&month="+month+"&day="+day, function(data) {
				flags.eventsJson = data; // save data to future filters
				getEventsData(flags.eventsJson, limit, year, month, day, direction);
			}).error(function() { 
				showError("error getting json: ");
			});
		} else {
			// filter previus saved json
			getEventsData(flags.eventsJson, limit, year, month, day, direction);
		}
	}

	function getEventsData(data, limit, year, month, day, direction){
		directionLeftMove = "-=" + flags.directionLeftMove;
		eventContentHeight = "auto";
		
		subtitle = flags.wrap.find('#eventsCalendar-list-wrap .eventsCalendar-subtitle')
		if (!direction) {
			// first load
			subtitle.html(eventsOpts.txt_NextEvents);
			eventContentHeight = "auto";
			directionLeftMove = "-=0";
		} else {
			if (day != '') {
				subtitle.html(eventsOpts.txt_SpecificEvents_prev + eventsOpts.monthNames[month] + " " + num_abbrev_str(day) + " " + eventsOpts.txt_SpecificEvents_after);
			} else {
				subtitle.html(eventsOpts.txt_SpecificEvents_prev + eventsOpts.monthNames[month] + " " + eventsOpts.txt_SpecificEvents_after);
			}
			
			if (direction === 'prev') {
				directionLeftMove = "+=" + flags.directionLeftMove;
			} else if (direction === 'day' || direction === 'month') {
				directionLeftMove = "+=0";
				eventContentHeight = 0;
			}
		}
		
		flags.wrap.find('.eventsCalendar-list').animate({
			opacity: eventsOpts.moveOpacity,
			left: directionLeftMove,
			height: eventContentHeight
		}, eventsOpts.moveSpeed, function() {
			flags.wrap.find('.eventsCalendar-list').css({'left':0, 'height': 'auto'}).hide();
			//wrap.find('.eventsCalendar-list li').fadeIn();
			
			var events = [];

			data = $(data).sort(sortJson); // sort event by dates

			// each event
			if (data.length) {
				var i = 0;
				$.each(data, function(key, event) {
					var eventDate = new Date(parseInt(event.date)),
							eventYear = eventDate.getFullYear(),
							eventMonth = eventDate.getMonth(),
							eventDay = eventDate.getDate();
					if (limit === 0 || limit > i) {
						var eventMonthToShow = eventMonth + 1,
							eventHour = eventDate.getHours(),
							eventMinute = eventDate.getMinutes();
							if (eventMinute <= 9) {
								eventMinute = "0" + eventMinute;
							}
						// if month or day exist then only show matched events
						if ((month == '' || month == eventMonth) && (day == '' || day == eventDay)) {
							eventStringDate = eventDay + "/" + eventMonthToShow + "/" + eventYear;
							events.push('<li id="' + key + '"><em>' + eventStringDate + '</em><time>'+eventHour+":"+eventMinute+'</time><strong>' + event.title + '</strong><p>' + event.description + '</p></li>');
							i++;
						}
					}
					
					// add mark in the dayList to the days with events
					if (eventYear == flags.wrap.attr('data-current-year') && eventMonth == flags.wrap.attr('data-current-month')) {
						flags.wrap.find('.currentMonth .eventsCalendar-daysList #dayList_' + eventDay).addClass('dayWithEvents');
					}
					
				});
			}
			// there is no events on this period
			if (!events.length) {
				events.push('<li class="eventsCalendar-noEvents"><p>' + eventsOpts.txt_noEvents + '</p></li>');
			}
			flags.wrap.find('.eventsCalendar-loading').hide();
			
			flags.wrap.find('.eventsCalendar-list')
				.html(events.join(''));
			
			flags.wrap.find('.eventsCalendar-list').animate({
				opacity: 1,
				height: "toggle"
			}, eventsOpts.moveSpeed);
				

		});
	}
	
	function changeMonth() {
		flags.wrap.find('.arrow').click(function(e){
			e.preventDefault();

			if ($(this).hasClass('next')) {
				dateSlider("next");
				var lastMonthMove = '-=' + flags.directionLeftMove;
				
			} else {
				dateSlider("prev");
				var lastMonthMove = '+=' + flags.directionLeftMove;
			}
			
			flags.wrap.find('.eventsCalendar-monthWrap.oldMonth').animate({
				opacity: eventsOpts.moveOpacity,
				left: lastMonthMove
			}, eventsOpts.moveSpeed, function() {
				flags.wrap.find('.eventsCalendar-monthWrap.oldMonth').remove();
			});
		});
	}

	function showError(msg) {
		flags.wrap.find('#eventsCalendar-list-wrap').html("<span class='eventsCalendar-loading error'>"+msg+" " +eventsOpts.eventsjson+"</span>");
	}
};


// definimos los parámetros junto con los valores por defecto de la función
$.fn.eventCalendar.defaults = {
    // para el fondo un color por defecto
    eventsjson: 'js/events.json',
	eventsLimit: 5,
	monthNames: [ "January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December" ],
	dayNames: [ 'Sunday','Monday','Tuesday','Wednesday',
		'Thursday','Friday','Saturday' ],
	txt_noEvents: "There is no events in this period",
	txt_SpecificEvents_prev: "",
	txt_SpecificEvents_after: "events:",
	txt_next: "next",
	txt_prev: "prev",
	txt_NextEvents: "Next events:",
	showDayAsWeeks: true,
	startWeekOnMonday: true,
	moveSpeed: 500,	// speed of month move when you clic on a new date
	moveOpacity: 0.15, // month and events fadeOut to this opacity
	cacheJson: true	// if true plugin get a json only first time and after plugin filter events
					// if false plugin get a new json on each date change
};

