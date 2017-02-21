import React from 'react'
import { Route, IndexRoute } from 'react-router'
import App from './components/App'
import Home from './components/Home'

module.exports = (
	<Route path="/" component = {App}>
		<IndexRoute component = {Home}/>
	</Route>
);