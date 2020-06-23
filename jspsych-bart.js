var settings = {
	baseSizeInPx: 40,
	pumpValue: 0.05,
	nTrials: 3,
	feedbackDisplayDuration: 1000, // ms
	maxPumps: [
		1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,12,12,12,12,12,12	
	]
};
var timeline = [];

var total = 0;

var instructions = {
    type: 'image-keyboard-response',
    stimulus: 'resources/ins.png',
    stimulus_height: 400,
    choices: [ 32 ], // space  
    on_finish: function(data) {
    	data.trialType = 'instructions';
    },
}

timeline.push(instructions);

function getSingleTrialTimeline(maxPump) {
	var variables = jsPsych.randomization.repeat({
		height: 1,		
		value: 1,
	}, maxPump, false);
	
	for (var i = 0; i < maxPump; i++) {
		variables[i].height = (i + 1) * settings.baseSizeInPx;
		variables[i].value = (i + 1) * settings.pumpValue;
	}

	var pumpingTimeline = {
		timeline: [
			{
				type: 'html-keyboard-response',		    
			    stimulus: function() {
			    	var html = "<p>Baloon value: " + jsPsych.timelineVariable('value', true).toFixed(2) + "$</p>";
	                html +="<img id='baloon' src='resources/redBalloon.png' style='height: " + jsPsych.timelineVariable('height', true) +"px;'>";
	                return html;
	            }, 
			    choices: [ 32, 13 ], // space, enter   
			    on_finish: function(data) {
					if(data.key_press == 13) { // enter
						var valueGained = Number.parseFloat(jsPsych.timelineVariable('value', true));
						total += valueGained;
						data.success = true;
						data.valueGained = valueGained;
						data.total = total;
						data.trialType = 'gain';
						jsPsych.endCurrentTimeline();
				    } else {
				    	data.trialType = 'pump';
				    }
				},
			},			
		],		
		timeline_variables: variables,  
	};

	return {
		timeline: [
			pumpingTimeline,
			{ // show feedback on last pumping effort
				type: 'audio-keyboard-response',
				stimulus: function () {
					var data = jsPsych.data.get().last(1).values()[0];
			        if(!!data.success){
			            return undefined;
			        } else {
			            return 'resources/bang.mp3';
			        }
				},
			    prompt: function () {
			    	// get the data from the previous trial,
			        // and check which key was pressed
			        var data = jsPsych.data.get().last(1).values()[0];
			        if(!!data.success){
			            return 'You gained ' + data.valueGained.toFixed(2) + '$<br>total: ' + data.total.toFixed(2) + '$';
			        } else {
			            return 'You gained nothing<br>total: ' + total.toFixed(2) + '$';
			        }			    	
			    }, 
			    on_finish: function(data) {
			    	data.trialType = 'feedback';
			    },
			    trial_duration: settings.feedbackDisplayDuration,
			    choices: jsPsych.NO_KEYS					    
			}
		]
	}
}

for (var i = 0; i < settings.maxPumps.length; i++) {
	timeline.push(getSingleTrialTimeline(settings.maxPumps[i]));
}

timeline.push({
	type: 'html-keyboard-response',
	stimulus: 'Total: ' + total + '$<br>Press any key to finish the task :)',
	trial_duration: settings.feedbackDisplayDuration,
	on_finish: function(data) {
    	data.trialType = 'task-end';
    },
});

// for debug
if (!window.jatos) {
	jatos = {
		onLoad: function(func) {
			func();
		}
	}
}

jatos.onLoad(function() {
	jsPsych.init( {
	    timeline: timeline,
	    preload_images: [ 'resources/ins.png', 'resources/redBalloon.png' ],
        preload_audio: [ 'resources/bang.mp3' ],
	    on_finish: function() {
	      var resultJson = jsPsych.data.get().json();
	      console.log(resultJson);
	      jatos.submitResultData(resultJson, jatos.startNextComponent);
	    }
	  });  
});
