import React, {Component} from 'react';
import {render} from 'react-dom';

import {StaticMap} from 'react-map-gl';
import DeckGL, {LineLayer, ScatterplotLayer} from 'deck.gl';
import GL from '@luma.gl/constants';
import DataProvider from './DataProvider';
import * as dsv from 'd3-dsv';

// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2lqbmpqazdlMDBsdnRva284cWd3bm11byJ9.V6Hg2oYJwMAxeoR9GEzkAA'; // eslint-disable-line

//初始化视点
export const INITIAL_VIEW_STATE = {
  latitude: 40.884127,
  longitude: -74.021807,
  zoom: 14.5,
  maxZoom: 25,
  pitch: 50,
  bearing: 0
};

// 解析数据
function path_handle(data){

  data = dsv.csvParse(data);

  let new_data = []

  data.forEach(function(d){

    let startPoints = [parseFloat(d.startX), parseFloat(d.startY), 10]

    let endPoints = [parseFloat(d.endX), parseFloat(d.endY), 10]

    let name = d.link_id + ': ' + d.street_length

    let meta = {'start':startPoints,'end':endPoints,'name':name}

    new_data.push(meta)
  })

  return new_data
}

export class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hoveredObject: null,
      linksData:{}
    };
    this._onHover = this._onHover.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);

    let that = this

    //读取管道数据
    DataProvider.getLinks().then(response => {
      
        let data = path_handle(response.data)

        that.setState({linksData: data})

        }, error => {
      
    });
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

    return [
      //绘制管线
      new LineLayer({
        id: 'road-paths',
        data: roads,
        fp64: false,
        getSourcePosition: d => d.start,
        getTargetPosition: d => d.end,
        getColor: [0, 0, 0],
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
            mapStyle="mapbox://styles/examples/cjj0b5ie80ec32so5uo8ox21m"
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
