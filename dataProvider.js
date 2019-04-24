import axios from 'axios';

export default class DataProvider {
 
    static getTubes(){

        return axios.get('https://raw.githubusercontent.com/HongyuJiang/three.js-tubes/master/data/PipeLine3D.csv')
    }



}