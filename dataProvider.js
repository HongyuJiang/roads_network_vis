import axios from 'axios';

export default class DataProvider {
 
    static getLinks(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/roads_network_vis/master/links.csv')
    }

    static getNodes(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/roads_network_vis/master/nodes.csv')
    }

    static getTaxis(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/three.js-tubes/master/data/PipeLine3D.csv')
    }


}