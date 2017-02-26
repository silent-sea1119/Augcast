import React from 'react';
import { Link } from 'react-router';


/**
 Home module - to be displayed on the side
 */
class Home extends React.Component {

    render () {
        return (
            <div>
            <h1>Home</h1>
            <Link to="/podcastview">Open PodcastView</Link>
            <br/>
            <Link to="/upload">Open Upload Page</Link>
            <br/>
            <Link to="/pdf">Open PDF Display Page</Link>
            <br/>
            <Link to="/elabrequest">Open Elaboration Request Page</Link>
            </div>
        );
    }
}

export default Home;
