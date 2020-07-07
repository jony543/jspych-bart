var settings = {
	baseSizeInPx: 40,
	pumpValue: 0.05,
	feedbackDisplayDuration: 1000, // ms
	maxPumps: 
		[ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,12,12,12,12,12,12 ]
};
var timeline = [];

var total = 0;

var instructions = {
    type: 'image-keyboard-response',
    stimulus: 'jspsych-bart/resources/ins.png',
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
		variables[i].value = i * settings.pumpValue;
	}

	var pumpingTimeline = {
		timeline: [
			{
				type: 'html-keyboard-response',		    
			    stimulus: function() {
			    	var html = "<p>ערכו של בלון זה: " + jsPsych.timelineVariable('value', true).toFixed(2) + "</p>";
	                html +="<img id='baloon' src='jspsych-bart/resources/redBalloon.png' style='height: " + jsPsych.timelineVariable('height', true) +"px;'>";
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
			            return 'jspsych-bart/resources/bang.mp3';
			        }
				},
			    prompt: function () {
			    	// get the data from the previous trial,
			        // and check which key was pressed
			        var data = jsPsych.data.get().last(1).values()[0];
			        if(!!data.success){
			            return 'עבור בלון זה הרווחת ' + data.valueGained.toFixed(2);
			        } else {
			            return 'אופס, הפסדת את הבלון הזה';
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

var shuffeledMaxPumps = jsPsych.randomization.repeat(settings.maxPumps, 1, false)

for (var i = 0; i < shuffeledMaxPumps.length; i++) {
	timeline.push(getSingleTrialTimeline(shuffeledMaxPumps[i]));
}

timeline.push({
	type: 'html-keyboard-response',
	stimulus: function () { return 'כל הכבוד, בסך הכל צברת ' + total.toFixed(2) },
	trial_duration: 3 * settings.feedbackDisplayDuration, // extending the time of the last message
	choices: jsPsych.NO_KEYS,
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

// for debug
if (!window.jatosComponentsRandomizer) {
	jatosComponentsRandomizer = jatos;
}

jatos.onLoad(function() {
	jsPsych.init( {
	    timeline: timeline,
	    preload_images: [ 'jspsych-bart/resources/ins.png', 'jspsych-bart/resources/redBalloon.png' ],
        preload_audio: [ 'jspsych-bart/resources/bang.mp3' ],
	    on_finish: function() {
	      var resultJson = jsPsych.data.get().json();
	      console.log(resultJson);
	      jatos.submitResultData(resultJson, jatosComponentsRandomizer.startNextComponent);
	    }
	  });  
});
