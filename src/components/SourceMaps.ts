import {
  SourceMapConsumer,
  RawSourceMap,
  RawIndexMap,
  Position,
  NullableMappedPosition,
} from 'source-map';

type Map = RawSourceMap | RawIndexMap | string;

class SourceMaps {
  private maps: {
    [key: string]: SourceMapConsumer;
  } = {};
  private consumer: SourceMapConsumer;

  async create(url: string, map: Map) {
    this.maps[url] = await new SourceMapConsumer(map);
  }

  getOriginalPosition(url: string, position: Position): NullableMappedPosition {
    return this.maps[url].originalPositionFor({
      line: position.line,
      column: position.column,
    });
  }
}

export default new SourceMaps();
