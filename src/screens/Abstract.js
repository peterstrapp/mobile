import React, { Component } from 'react';
import {DeviceEventEmitter, Modal, View, Text} from 'react-native';
import GlobalStyles from "../Styles";
import ApplicationState from "../ApplicationState";
import HeaderTitleView from "../components/HeaderTitleView"
import HeaderButtons, { HeaderButton, Item } from 'react-navigation-header-buttons';
import Icon from 'react-native-vector-icons/Ionicons';

const IoniconsHeaderButton = passMeFurther => (
  // the `passMeFurther` variable here contains props from <Item .../> as well as <HeaderButtons ... />
  // and it is important to pass those props to `HeaderButton`
  // then you may add some information like icon size or color (if you use icons)
  <HeaderButton {...passMeFurther} IconComponent={Icon} iconSize={30} color={GlobalStyles.constants().mainTintColor} />
);

export default class Abstract extends Component {

  static getDefaultNavigationOptions = ({ navigation, navigationOptions, templateOptions }) => {
    // templateOptions allow subclasses to specifiy things they want to display in nav bar before it actually loads.
    // this way, things like title and the Done button in the top left are visible during transition
    if(!templateOptions) { templateOptions = {}; }
    let options = {
      headerTitle:<HeaderTitleView title={navigation.getParam("title") || templateOptions.title} subtitle={navigation.getParam("subtitle") || templateOptions.subtitle}/>,
      headerStyle: {
        backgroundColor: GlobalStyles.constants().mainBackgroundColor
      },
      headerTintColor: GlobalStyles.constants().mainTintColor,
      drawerLockMode: navigation.getParam("drawerLockMode") || templateOptions.drawerLockMode
    }

    let headerLeft, headerRight;
    let leftButton = navigation.getParam('leftButton') || templateOptions.leftButton;
    if(leftButton) {
      headerLeft = (
        <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
          <Item disabled={leftButton.disabled} title={leftButton.title} iconName={leftButton.iconName} onPress={leftButton.onPress} />
        </HeaderButtons>
      )

      options.headerLeft = headerLeft;
    }

    let rightButton = navigation.getParam('rightButton') || templateOptions.rightButton;
    if(rightButton) {
      headerRight = (
        <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
          <Item disabled={rightButton.disabled} title={rightButton.title} iconName={rightButton.iconName} onPress={rightButton.onPress} />
        </HeaderButtons>
      )

      options.headerRight = headerRight;
    }

    return options;
  }

  static navigationOptions = ({ navigation, navigationOptions }) => {
    return Abstract.getDefaultNavigationOptions({navigation, navigationOptions});
  };

  constructor(props) {
    super(props);

    this.state = {lockContent: true};

    this.listeners = [
      this.props.navigation.addListener('willFocus', payload => {this.componentWillFocus();}),
      this.props.navigation.addListener('didFocus', payload => {this.componentDidFocus();}),
      this.props.navigation.addListener('willBlur', payload => {this.componentWillBlur();}),
      this.props.navigation.addListener('didBlur', payload => {this.componentDidBlur();})
    ];

    this._stateObserver = ApplicationState.get().addStateObserver((state) => {
      if(!this.isMounted()) {
        return;
      }

      if(state == ApplicationState.Unlocking) {
        this.unlockContent();
      }

      if(state == ApplicationState.Locking) {
        this.lockContent();
      }
    })
  }

  componentWillUnmount() {
    for(var listener of this.listeners) {
      listener.remove();
    }
  }

  componentWillFocus(){

  }

  componentDidFocus(){

  }

  componentWillBlur(){

  }

  componentDidBlur(){

  }

  getProp(prop) {
    // this.props.navigation could be undefined if we're in the drawer
    return this.props.navigation.getParam && this.props.navigation.getParam(prop);
  }

  setTitle(title, subtitle) {
    let options = {};
    options.title = title;
    options.subtitle = subtitle;
    this.props.navigation.setParams(options);
  }

  // Called by RNN
  componentDidAppear() {
    this.visible = true;
    this.willBeVisible = true; // Just in case willAppear isn't called for whatever reason
    this.configureNavBar(false);
  }

  // Called by RNN
  componentDidDisappear() {
    console.log("Component did disappear", this);
    this.willBeVisible = false;
    this.visible = false;
  }

  lockContent() {
    this.mergeState({lockContent: true});
    this.configureNavBar();
  }

  unlockContent() {
    if(!this.loadedInitialState) {
      this.loadInitialState();
    }
    this.mergeState({lockContent: false});
  }

  componentWillUnmount() {
    this.willUnmount = true;
    this.mounted = false;
    ApplicationState.get().removeStateObserver(this._stateObserver);
  }

  componentWillMount() {
    this.willUnmount = false;
    this.mounted = false;
    if(ApplicationState.get().isUnlocked() && this.state.lockContent) {
      this.unlockContent();
    }
  }

  componentDidMount() {
    this.mounted = true;
    this.configureNavBar(true);

    if(ApplicationState.get().isUnlocked() && !this.loadedInitialState) {
      this.loadInitialState();
    }

    if(this._renderOnMount) {
      this._renderOnMount = false;
      this.forceUpdate();

      this._renderOnMountCallback && this._renderOnMountCallback();
      this._renderOnMountCallback = null;
    }
  }

  loadInitialState() {
    this.loadedInitialState = true;
    this.configureNavBar(true);
  }

  constructState(state) {
    this.state = _.merge({lockContent: ApplicationState.get().isLocked()}, state);
  }

  mergeState(state) {
    this.setState(function(prevState){
      return _.merge(prevState, state);
    })
  }

  renderOnMount(callback) {
    if(this.isMounted()) {
      this.forceUpdate();
      callback && callback();
    } else {
      this._renderOnMount = true;
      this._renderOnMountCallback = callback;
    }
  }

  isMounted() {
    return this.mounted;
  }

  configureNavBar(initial) {

  }

  dismissModal() {
    Navigation.dismissModal();
  }
}
