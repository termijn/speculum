<template>
    <div class="weatherforecast-container">
        <table>
            <tr v-for="line in lines" v-bind:key="line.when">
                <td v-bind:style="{opacity: line.opacity}">{{ line.when }}</td>
                <td v-bind:style="{opacity: line.opacity}"><i class="owi" v-bind:class="line.icon"></i></td>
                <td v-bind:style="{opacity: line.opacity}">{{ line.temp }}&deg;</td>
            </tr>
        </table>
    </div>
</template>


<script>
    import common from './common';
    import '../../node_modules/open-weather-icons/dist/css/open-weather-icons.css';
    import axios from '../../node_modules/axios/dist/axios';

    import '../css/weatherforecast.css';

    export default {
        name: "WeatherForecast",
        data: function() {
            return { lines: [] }
        },
        mounted: function() {
            this.update();
        },
        methods: {
            update: function() {
                const self = this;
                common.interval(10 * 60 * 1000, function() {
                    axios.get('/getWeatherForecast')
                    .then(function(response) {
                        self.parse(response.data);
                    });
                });
            },
            parse: function(days) {
                const self = this;

                self.lines = [];
                // lines => [ { when, icon, temp } ];
                var today = days[0];
                var opacity = 1;
                today.forecasts.forEach(function(forecast) {
                    var dateTime = new Date(forecast.dateTime);
                    var hours = dateTime.getHours();
                    var minutes = dateTime.getMinutes();
                    var line = {
                        opacity: opacity,
                        when: hours + ':' + minutes.toLocaleString(undefined, {minimumIntegerDigits: 2}),
                        icon: 'owi-'+forecast.icon,
                        temp: Math.round(forecast.temp) };
                    self.lines.push(line);
                });

                days.splice(0, 1);

                days.forEach(function(day) {
                    var forecast = false;
                    day.forecasts.forEach(function(f){
                        if (!forecast || f.temp > forecast.temp) {
                            forecast = f;
                        }
                    });

                    var dateTime = new Date(day.date);
                    opacity -= 0.15;
                    if (opacity < 0.0) opacity = 0;
                    var line = {
                        opacity: opacity,
                        when: common.weekdayToStr[dateTime.getDay()],
                        icon: 'owi-'+forecast.icon,
                        temp: Math.round(forecast.temp) };
                    self.lines.push(line);
                });
            }
        }
    };
</script>