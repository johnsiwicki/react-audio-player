import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

import "./styles.css";

// COMPONENTS
class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playStatus: "play",
      currentTime: 0,
      contentEditable: false,
      track: {}
    };
  }

  static defaultProps = {};

  componentDidMount() {
    //get our episode info
    axios
      .get(
        `https://wt-ad210117ae0763755b5eff02713bca3c-0.sandbox.auth0-extend.com/this-worked`
      )
      .then(response => {
        //convert our date to readable format
        var d = new Date(response.data.episode.published_at);
        var pubDate = d.toDateString();

        this.setState({
          track: {
            showname: response.data.episode.title,
            description: response.data.episode.stripped_description,
            album: response.data.episode.title,
            published: pubDate,
            artwork: response.data.episode.image_url,
            duration: response.data.episode.duration,
            source: response.data.episode.enclosure_url
          }
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  updateTime = timestamp => {
    timestamp = Math.floor(timestamp);
    this.setState({ currentTime: timestamp });
  };
  updateScrubber = percent => {
    // Set scrubber width
    let innerScrubber = document.querySelector(".Scrubber-Progress");
    innerScrubber.style["width"] = percent;
  };
  togglePlay = () => {
    let status = this.state.playStatus;
    //let audio = document.getElementById('audio');
    let audio = this.audioEl;
    if (status === "play") {
      audio.play();
      status = "pause";
      setInterval(() => {
        let currentTime = audio.currentTime;
        let duration = this.state.track.duration;
        // Calculate percent of song
        let percent = currentTime / duration * 100 + "%";
        this.updateScrubber(percent);
        this.updateTime(currentTime);
      }, 100);
    } else {
      status = "play";
      audio.pause();
    }
    this.setState({ playStatus: status });
  };
  goBack = () => {
    //back button 5 seconds
    let audio = this.audioEl;
    const moveBackward = () => {
      audio.currentTime -= 5;
    };
    moveBackward();
  };
  goForward = () => {
    //forward button 5 seconds
    let audio = this.audioEl;
    const moveForward = () => {
      audio.currentTime += 5;
    };
    moveForward();
  };

  toggleEdit = () => {
    //set up editable data
    let cEdit = this.state.contentEditable;
    let showName = document.getElementById("Name").innerHTML;
    let showDes = document.getElementById("Artist").innerHTML;
    let trackData = this.state.track;

    if (cEdit === true) {
      this.setState({ contentEditable: false });
      this.setState(prevState => ({
        track: {
          ...prevState.track,
          showname: showName,
          description: showDes
        }
      }));
      //set new data and then send it back to the server
      axios
        .patch("https://api.breaker.audio/shows/185226/episodes/29314799", {
          headers: { "User-Agent": "Breaker/1.0.0 (0)" },
          data: { trackData }
        })
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          console.log(error);
        });
    } else {
      this.setState({ contentEditable: true });
    }
  };

  render() {
    return (
      <div className="Player">
        <div
          className="Background"
          style={{ backgroundImage: "url(" + this.state.track.artwork + ")" }}
        />
        <div className="Header">
          <div className="Title">Now playing</div>
        </div>
        <Editor onClick={this.toggleEdit} edit={this.state.contentEditable} />
        <div
          className="Artwork"
          style={{ backgroundImage: "url(" + this.state.track.artwork + ")" }}
        />
        <TrackInformation
          track={this.state.track}
          edit={this.state.contentEditable}
          onChange={this.updateText}
        />
        <Scrubber />
        <Rewind onClick={this.goBack} />
        <Controls isPlaying={this.state.playStatus} onClick={this.togglePlay} />
        <Forward onClick={this.goForward} />
        <Timestamps duration={this.state.track} currentTime={this.state} />
        {this.state.track &&
          this.state.track.source && (
            <audio ref={el => (this.audioEl = el)}>
              <source src={this.state.track.source} />
            </audio>
          )}
      </div>
    );
  }
}

class TrackInformation extends React.Component {
  render() {
    return (
      <div className="TrackInformation">
        <div contentEditable={this.props.edit} className="Name" id="Name">
          {this.props.track.showname}
        </div>
        <div contentEditable={this.props.edit} className="Artist" id="Artist">
          {this.props.track.description}
        </div>
        <div className="Date" id="Date">
          {this.props.track.published}
        </div>
      </div>
    );
  }
}

class Scrubber extends React.Component {
  render() {
    return (
      <div className="Scrubber">
        <div className="Scrubber-Progress" />
      </div>
    );
  }
}

class Editor extends React.Component {
  render() {
    let classNames;
    if (this.props.edit == true) {
      classNames = "fa fa-fw fa-floppy-o";
    } else {
      classNames = "fa fa-fw fa-pencil";
    }

    return (
      <div className="Edit">
        <div onClick={this.props.onClick} className="Button">
          <i className={classNames} />
        </div>
      </div>
    );
  }
}

class Controls extends React.Component {
  render() {
    let classNames;
    if (this.props.isPlaying == "pause") {
      classNames = "fa fa-fw fa-pause";
    } else {
      classNames = "fa fa-fw fa-play";
    }

    return (
      <div className="Controls">
        <div onClick={this.props.onClick} className="Button">
          <i className={classNames} />
        </div>
      </div>
    );
  }
}

class Rewind extends React.Component {
  render() {
    let classNames = "fa fa-fw fa-backward";
    return (
      <div className="c-Back">
        <div onClick={this.props.onClick} className="Button">
          <i className={classNames} />
        </div>
      </div>
    );
  }
}

class Forward extends React.Component {
  render() {
    let classNames = "fa fa-fw fa-forward";
    return (
      <div className="c-Forward">
        <div onClick={this.props.onClick} className="Button">
          <i className={classNames} />
        </div>
      </div>
    );
  }
}

class Timestamps extends React.Component {
  convertTime = timestamp => {
    let minutes = Math.floor(timestamp / 60);
    let seconds = timestamp - minutes * 60;
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    timestamp = minutes + ":" + seconds;
    return timestamp;
  };
  render() {
    return (
      <div className="Timestamps">
        <div className="Time Time--current">
          {this.convertTime(this.props.currentTime.currentTime)}
        </div>
        <div className="Time Time--total">
          {this.convertTime(this.props.currentTime.track.duration)}
        </div>
      </div>
    );
  }
}

// Render the UI
ReactDOM.render(<Player />, document.getElementById("root"));
