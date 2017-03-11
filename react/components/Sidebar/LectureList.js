// Lecture.js
// List all lectures of podcast-enabled courses

import React from 'react';
import FA from 'react-fontawesome';
import IconButton from 'material-ui/IconButton';
import ActionBackup from 'material-ui/svg-icons/action/backup';
import ActionCached from 'material-ui/svg-icons/action/cached';
import ActionDone from 'material-ui/svg-icons/action/done';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import { FormControl } from 'react-bootstrap';
import UploadContainer from '../Upload';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { database } from './../../../database/database_init';


//import PodcastView from '../PodcastView.js';
import { displayLecture } from '../../redux/actions';
import Fuse from 'fuse.js';

import {database} from '../../../database/database_init';

injectTapEventPlugin();

class UploadButton extends React.Component {
    constructor(props) {
        super(props);

        // initial states
        this.state = {};
    }

    render() {
        var that = this;
        return (
            <div className="slides-status">
                <IconButton tooltip="Upload slides" onTouchTap={() => {that.props.onClick(that.props.iconLecture);}}>
                    <ActionBackup />
                </IconButton>
            </div>
        );
    }
}

class DoneMark extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="slides-status">
                <IconButton tooltip="Slides have been uploaded">
                    <ActionDone />
                </IconButton>
            </div>
        );
    }
}

class LabelingProgressChart extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var that = this;
        return (
            <div className="slides-status">
                <IconButton
                    tooltip={'Progress: ' + that.props.progress}
                    onTouchTap={() => {that.props.onClick(that.props.iconLecture);}}>
                    <ActionCached />
                </IconButton>
            </div>
        );
    }
}

class UploadIconController extends React.Component {
    constructor(props) {
        super(props);

        this.state = {}
    }

    componentDidMount() {
        // Store reference to database listener so it can be removed
        var that = this;
        var course = this.props.iconCourse;
        var lecture = this.props.iconLecture;

        if (course != undefined && lecture != undefined) {

            // console.log('PodcastView was mounted: ' + JSON.stringify(that.props));
            var ref = database.ref('/lectures/' + course.id + '/' + lecture.id);

            // Listen to changes at ref's location in db
            var iconRef = ref.on('value', function(snapshot) {
                that.setState({
                    lectureInfo: snapshot.val()
                });
            });

            this.setState({
                firebaseListener: ref,
                firebaseCallback: iconRef
            });

        }
        console.log('controller mounted');
    }

    componentWillReceiveProps(newProps) {

        // Remove old database Listener
        if (this.state.firebaseListener != undefined) {
            this.state.firebaseListener.off('value', this.state.firebaseCallback);
        }

        // Create and store new listener so it can too be removed
        var that = this;
        var newRef = database.ref('lectures/' + newProps.iconCourse.id + '/' + newProps.iconLecture.id);

        var iconRef = newRef.on('value', function(snapshot) {
            that.setState({
                lectureInfo: snapshot.val()
            });
        });

        this.setState({
            firebaseListener: newRef,
            firebaseCallback: iconRef
        });

    }

    // Destructor, removes database listener when component is unmounted
    componentWillUnmount() {
        //Remove the database listener
        if (this.state.firebaseListener != undefined) {
            this.state.firebaseListener.off('value', this.state.firebaseCallback);
        }    }

    render() {

        // If lecture info not loaded from DB just chill out
        if (this.state.lectureInfo == undefined) {
            return (<div></div>);
        }

        // If there are timestamps in DB, display check mark
        if (this.state.lectureInfo.timestamps != undefined) {
            return (<DoneMark/>);
        }

        // If there is progress in the database, display a progress pie chart
        if (this.state.lectureInfo.labelProgress != undefined) {
            return (
                <LabelingProgressChart
                    onClick={this.props.uploadButtonOnClick}
                    iconLecture={this.props.iconLecture}
                    progress={this.state.lectureInfo.labelProgress}/>
            );
        }

        // If no progress, then display upload Button
        return (
            <UploadButton
                onClick={this.props.uploadButtonOnClick}
                iconLecture={this.props.iconLecture}/>
        );
    }
}

class LectureList extends React.Component {
    constructor(props) {
        super(props);

        // Initial state
        this.state = {
            render: (this.props.currentLecture) ? this.props.currentLecture.id : undefined,
            lectures: []
            upload: undefined
        };

        // inherit all course data
        this.course = this.props.navCourse;
        this.searchInput = this.searchInput.bind(this);
        this.searchForContent = this.searchForContent.bind (this);

        // helper object
        this.calendar = {
            1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
            7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
        };

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

    }

    selectLecture(lecture) {
        this.props.displayLecture(this.course, lecture);
        browserHistory.push('/' + this.course.id + '/' + lecture.num);
    }

    searchInput (e) {
        let query = e.target.value;
        let course = this.props.currentCourse.id;
        var that = this;

        // getting array of lectures of this course
        database.ref('/lectures/' + course).once('value').then(function(snapshot) {
            that.setState ({lectures: Object.values(snapshot.val())});
            that.searchForContent(query);
        });
    }

    searchForContent (query) {
        var options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 70,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ['content']
        };

        var fuse = new Fuse(this.state.lectures, options);
        var result = fuse.search(query);
        console.log (result);
        return result;

    openModal(lecture) {
        this.setState({upload: lecture, modal: true});
    }

    closeModal() {
        this.setState({upload: undefined, modal: false});
    }

    render () {
        // access to this
        var that = this;

        var listItem = function(lectureID) {
            var lecture = that.props.lectures[lectureID];
            var month = that.calendar[lecture.month];
            return (
                <li key={lecture.id}
                    className={(that.props.currentLecture && lecture.id == that.props.currentLecture.id) ? 'lecture-item selected' : 'lecture-item'}>
                    <div className="lecture-button" onClick={() => {that.selectLecture(lecture);}}>
                        Week {lecture.week}, {lecture.day}, {month}/{lecture.date}
                    </div>
                    <UploadIconController uploadButtonOnClick={that.openModal} iconLecture={lecture} iconCourse={that.props.navCourse}/>
                </li>
            );
        };

        // Set page title
        document.title = this.course.dept + ' ' + this.course.num + ' - Augcast';

        return (
            <div>
                <div className="nav">
                    <div className="search-bar">
                        <div className="search-icon"><FA name='arrow-left' onClick={that.props.back}/></div>
                        <FormControl type="text"
                                     placeholder={'Search ' + this.course.dept + ' ' + this.course.num + '...'}
                                     onChange={this.searchInput}
                                     className="search-box" />
                    </div>
                    <div className="lectures-wrapper">
                        <ul className="lecture-list">
                            {that.props.navCourse.lectures.map(listItem)}
                        </ul>
                    </div>
                </div>
                <UploadContainer lecture={this.state.upload} open={this.state.modal} close={this.closeModal}/>
            </div>
        );
    }
}


function mapStateToProps (state) {
    return {
        navCourse:  state.navCourse,
        currentLecture:  state.currentLecture,
        currentCourse: state.currentCourse
    };
}

function mapDispatchToProps (dispatch) {
    return {
        displayLecture: (currentCourse, currentLecture) => {
            dispatch (displayLecture(currentCourse, currentLecture));
        }

    };
}

const LectureListContainer = connect (mapStateToProps, mapDispatchToProps)(LectureList);
export default LectureListContainer;
