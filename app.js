import React, {Component} from 'react';
import {render} from 'react-dom';

import {StaticMap} from 'react-map-gl';
import DeckGL, {LineLayer, TripsLayer} from 'deck.gl';
import GL from '@luma.gl/constants';
import DataProvider from './DataProvider';
import * as dsv from 'd3-dsv';

// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaG9uZ3l1amlhbmciLCJhIjoiY2o1Y2VldHpuMDlyNTJxbzh5dmx2enVzNCJ9.y40wPiYB9y6qJE6H4PrzDw'; // eslint-disable-line

//初始化视点
export const INITIAL_VIEW_STATE = {
  latitude: 40.884127,
  longitude: -74.021807,
  zoom: 14.5,
  maxZoom: 25,
  pitch: 50,
  bearing: 0
};

var road_locations_dict = {}

// 解析数据
function path_handle(data){

  data = dsv.csvParse(data);

  let new_data = []

  data.forEach(function(d){

    d.startX = parseFloat(d.startX)
    d.endX = parseFloat(d.endX)
    d.startY = parseFloat(d.startY)
    d.endY = parseFloat(d.endY)

    let startPoints = [d.startX, d.startY, 10]

    let endPoints = [d.endX, d.endY, 10]

    let name = d.link_id + ': ' + d.street_length

    if(d.startY < 40.876760 && d.startY > 40.702641 && d.startX < -73.905251 && d.startX > -74.022418){

      let meta = {'start':startPoints,'end':endPoints,'name':name}

      new_data.push(meta)
    }

    road_locations_dict[d.link_id] = startPoints
  })

  return new_data
}

function path_segments_constructor(data){

  let trips_data = []

  let taxis_segments_bukets = {}

  data = dsv.csvParse(data);

  console.log(data)

  data.forEach(function(d){

    let coor =  road_locations_dict[parseInt(d.road_id)]
    let coor2 = [coor[0], coor[1], parseInt(d.round) * 100]
    //console.log(parseInt(d.round) )
    //let occupation = d.occipation

    if(taxis_segments_bukets[d.taxis_id] == undefined){

      taxis_segments_bukets[d.taxis_id] = []
      taxis_segments_bukets[d.taxis_id].push(coor2)
    }
    else{

      taxis_segments_bukets[d.taxis_id].push(coor2)
    }
  })

  for (let taxi in taxis_segments_bukets){

    let sorted_data = taxis_segments_bukets[taxi].sort(function(a,b){

      if (a[2] === b[2]) {
        return 0;
      }
      else {
          return (a[2] < b[2]) ? -1 : 1;
      }
    })

    let meta = {'segments':sorted_data}

    trips_data.push(meta)
  }

  console.log(trips_data)

  return trips_data
}

export class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0,
      hoveredObject: null,
      linksData:{},
      tripsData:{}
    };
    this._onHover = this._onHover.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);

    let that = this

    //读取管道数据
    DataProvider.getLinks().then(response => {
      
        let data = path_handle(response.data)

        that.setState({linksData: data})

        DataProvider.getTaxisPath().then(response => {
      
          let data = path_segments_constructor(response.data)
  
          that.setState({tripsData: data})
  
          }, error => {
        
      });

        }, error => {
      
    }); 
  }

  componentDidMount() {
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {

    //console.log(this.state.time)
    const {
      loopLength = 1000 * 100, // unit corresponds to the timestamp in source data
      animationSpeed = 100 // unit time per second
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength
    });
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }

  //鼠标悬停
  _onHover({x, y, object}) {
    this.setState({x, y, hoveredObject: object});
  }

  //绘制提示框
  _renderTooltip() {
    const {x, y, hoveredObject} = this.state;
    return (
      hoveredObject && (
        <div className="tooltip" style={{left: x, top: y}}>
          <div>{hoveredObject.country || hoveredObject.abbrev}</div>
          <div>{hoveredObject.name.indexOf('0x') >= 0 ? '' : hoveredObject.name}</div>
        </div>
      )
    );
  }

  
  //绘制图层
  _renderLayers() {
    const {
      getWidth = 1
    } = this.props;

    const roads = this.state.linksData
    const trips = this.state.tripsData
    const trailLength = 180

    return [
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: d => d.segments,
        getColor: [255, 81, 63],
        opacity: 1,
        widthMinPixels: 5,
        rounded: true,
        trailLength,
        currentTime: this.state.time,
        //pickable: true,
       // onHover: this._onHover
      }),
      //绘制管线
      new LineLayer({
        id: 'road-paths',
        data: roads,
        fp64: false,
        opacity: 0.1,
        getSourcePosition: d => d.start,
        getTargetPosition: d => d.end,
        getColor: [157, 211, 217],
        getWidth,
        pickable: true,
        onHover: this._onHover
      })
    ];
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={controller}
        pickingRadius={5}
        //设置渲染方式
        parameters={{
          blendFunc: [GL.SRC_ALPHA, GL.ONE, GL.ONE_MINUS_DST_ALPHA, GL.ONE],
          blendEquation: GL.FUNC_ADD
        }}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            //使用mapbox studio设置地图风格
            mapStyle="mapbox://styles/hongyujiang/cj6hkeqlb4cr62ro999s4o87o"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}

        {this._renderTooltip}
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
