
const weekdayToStr = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const monthToStr = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

var weatherToday =  
{
    template: '<div class="weathertoday"><i class="owi" v-bind:class="icon"></i> <span>{{ temp }}</span>  <div class="description">{{ description }}</div></div>',
    /* TODO: use a html builder
    tag('div', 
        tag('span','{{ temp }}') +
        tag('img', {'v-bind:src':'iconurl' })
    ),
    */
    
    data: function() {
        return {
            temp: '',
            icon: '',
            description: ''
        };
    },
    mounted : function() {
        this.update();
    },
    methods: {
        update: function() {
            const self = this;
            interval(60 * 1000 * 60, function() {
                axios.get('/getWeatherToday')
                .then(function(response){
                    self.temp = 
                        response.data.temperature + 
                        String.fromCharCode(176);
                    self.icon = "owi-" + response.data.icon;
                    self.description = response.data.description;
                });
            });
        }
    }
};

var currentTime = {
    template: '<div class="date">'+
              '  <div>{{dayofweek}}, {{dayofmonth}} {{month}} {{year}}</div>'+
              '  <div class="time">{{time}}</div>'+
              '</div>',
    data: function() {
        return {
            time: '', 
            dayofweek: '', 
            dayofmonth: '', 
            month: '',
            year: ''
        };
    },
    mounted: function() {
        this.update();
    },
    methods: {
        update: function()
        {
            const self = this;
            interval(60 * 1000, function(){
                var d = new Date();
                self.time = d.getHours() + ":" + d.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
                self.dayofweek = weekdayToStr[d.getDay()];
                self.month = monthToStr[d.getMonth()];
                self.dayofmonth = d.getDate();
                self.year = d.getFullYear();
            });
        }
    }
}

var greeting = {
    template: '<div class="message"><transition name="fade"><span v-if="visible">{{message}}</span></transition></div>',
    data: function() {
        return { message: "Goedemorgen", visible: false };
    },
    mounted: function() {
        const self = this;
        setTimeout(function(){self.visible = true;}, 100);
        setTimeout(function(){self.visible = false;}, 5000);
    }
}

var headlines = {
    template: '<div class="headlines"><span> {{ currentheadline }} </span></div>',
    data: function() {
        return { headlines: [], currentheadline: '', index: 0 }
    },
    mounted : function() {
        this.update();
    },
    methods: {
        update: function() {
            const self = this;
            interval(1000 * 60, function() {
                axios.get('/getHeadlines')
                .then(function(response){
                    self.headlines = response.data.headlines;
                    self.index = 0;
                    self.updateCurrent();
                });
            });
            interval(5000, function() {
                self.updateCurrent();
            })
        },
        updateCurrent: function() {
            this.index = this.index + 1 % this.headlines.length;
            this.currentheadline = this.headlines[this.index];
        }

    }
}

var xkcd = {
    template: '<div class="xkcd"><img v-bind:src="imgurl"></div>',
    data: function() {
        return { imgurl: '' };
    },
    mounted: function() {
        const self = this;
        axios.get('/getXkcd')
                .then(function(response){
                   self.imgurl = response.data.img;
                });
    }
}

var app = new Vue({
    el: '#SpeculumApp',
    data: {
        time: "",
        show: true,
        message: 'Goedemorgen',
        appointments: [
                { title: "Feestje Kasper", date: "25 augustus" },
                { title: "Tim spelen", date: "25 augustus" },
                { title: "Bo breien", date: "25 augustus" }
            ],
        days: [
            { name: 'Maandag', temp: "12" + String.fromCharCode(176) },
            { name: 'Dinsdag', temp: "12" + String.fromCharCode(176) },
            { name: 'Woensdag', temp: "12" + String.fromCharCode(176) }
        ]          
    },
    components: {
        'weather-today': weatherToday,
        'current-time': currentTime,
        'greeting': greeting,
        'headlines': headlines,
        'xkcd': xkcd
    }
});


function interval(intervalDuration, callback)
{
    callback();
    setTimeout(function () {
        callback();
        interval(intervalDuration, callback);
    }, intervalDuration);
}