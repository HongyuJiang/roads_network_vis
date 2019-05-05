import axios from 'axios';

export default class DataProvider {
 
    static getLinks(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/roads_network_vis/master/links.csv')
    }

    static getNodes(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/roads_network_vis/master/nodes.csv')
    }

    static getTaxisPath(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/roads_network_vis/master/realtime.3000t.csv')
    }


}