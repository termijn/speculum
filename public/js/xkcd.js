import axios from '../../node_modules/axios/dist/axios';
import '../css/xkcd.css';

export default {
    template: '<div class="xkcd" onerror="this.style.display=\'none\"><img v-bind:src="imgurl"></div>',
    data: function() {
        return { imgurl: '', alt: '' };
    },
    mounted: function() {
        const self = this;
        axios.get('/getXkcd')
                .then(function(response){
                   self.imgurl = response.data.img;
                   self.alt = response.data.alt;
                });
    }
}