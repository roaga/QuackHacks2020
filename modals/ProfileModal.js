import React from 'react'
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, ActivityIndicator, Modal} from 'react-native'
import * as firebase from 'firebase'
import {Ionicons} from '@expo/vector-icons'
import * as Animatable from 'react-native-animatable';

import styles from "../Styles"
import {colors} from "../Styles"

class IndivPickupCard extends React.Component {
    state = {
        readyForPickUp: false,
        holderAddress: "",
        holderEmail: "",
        holderName: "",
        courierEmail: "",
        courierName: "",
        courierAddress: ""
    }

    markReady = () => {
        let hEmail = this.state.holderEmail;
        this.setState({readyForPickUp: !this.state.readyForPickUp});
        const orderref = firebase.firestore().collection('requests').doc(this.props.order.id);
        let uemail = firebase.auth().currentUser.email;
        orderref.get().then(function(doc){
            if(doc.exists){
                let stops = doc.data().chain.length - 2;
                let currentIndex = doc.data().currentIndex;
                let newIndex = currentIndex + 1;
                orderref.update({currentIndex: newIndex});
                if(currentIndex != 0){
                    firebase.firestore().collection('users').doc(hEmail).get().then(function(d){
                        let newPoints = d.data().points +  100 / (stops);
                        firebase.firestore().collection('users').doc(hEmail).update({points: newPoints});
                    })
                }
                if (doc.data().from == firebase.auth().currentUser.email) { 
                    firebase.firestore().collection("archives").add(doc.data()); // add data to archives
                    orderref.delete(); // delete data from requests
                }
            }
        });
    }

    componentDidMount(){
        const orderref = firebase.firestore().collection('requests').doc(this.props.order.id);
        orderref.onSnapshot(function(doc){
            if(doc.exists){
                let holder = doc.data().chain[doc.data().currentIndex];
                if(doc.data().chain.length>1){
                    if(doc.data().currentIndex < doc.data().chain.length - 1){
                        let courier = doc.data().chain[doc.data().currentIndex + 1];
                        this.setState({courierEmail: courier.email});
                        this.setState({courierName: courier.name});
                        this.setState({courierAddress: courier.address});
                    } else {
                        this.setState({courierEmail: "Searching..."});
                        this.setState({courierName: "Searching..."});
                        this.setState({courierAddress: "Searching..."});
                    }
                }
                this.setState({holderEmail: holder.email});
                this.setState({holderName: holder.name});
                this.setState({holderAddress: holder.address});   
            }     
       }.bind(this))
    }
    render () {
        return (
            <Animatable.View style={styles.card} animation="slideInUp" duration={500}>
                <Text style={[styles.subtitle, {alignSelf: "flex-start"}]}>Courier: {this.state.courierName}</Text>
                <Text style={[styles.subtitle, {alignSelf: "flex-start", fontSize: 16}]}>Holder: {this.state.holderName}</Text>
                <Text style={[styles.subtitle, {alignSelf: "flex-start", fontSize: 16}]}>{this.state.holderAddress}</Text>

                <View style={{flexDirection: "row", alignSelf: "flex-end", marginTop: 8, position: "absolute", bottom: 16}}>
                    <Text style={[styles.subtitle, {marginHorizontal : 32, fontSize: 16, fontWeight: "700"}]}>I've picked up the order</Text>
                    {(!this.state.readyForPickUp && this.state.courierEmail == firebase.auth().currentUser.email) ? <TouchableOpacity onPress={() => this.markReady()}>
                        <Ionicons name={this.state.readyForPickUp ? "md-square" : "md-square-outline"} size={24} color={colors.primary} style={{width: 32}} />
                    </TouchableOpacity> : null}
                </View>
            </Animatable.View>
        );
    }
}

class IndivOrderCard extends React.Component {
    state = {
        readyForPickUp: false,
        chainEnded: false,
        holderAddress: "",
        holderEmail: "",
        holderName: "",
        courierEmail: "",
        courierName: "",
        courierAddress: ""
    }

    // endChain = () => {
    //     this.setState({chainEnded: !this.state.chainEnded});
    // }

    componentDidMount(){
        const orderref = firebase.firestore().collection('requests').doc(this.props.order.id);
        orderref.onSnapshot(function(doc){
            if(doc.exists){
                let holder = doc.data().chain[doc.data().currentIndex];
                if(doc.data().chain.length>1){
                    if(doc.data().currentIndex < doc.data().chain.length - 1){
                        let courier = doc.data().chain[doc.data().currentIndex + 1];
                        this.setState({courierEmail: courier.email});
                        this.setState({courierName: courier.name});
                        this.setState({courierAddress: courier.address});
                    } else {
                        this.setState({courierEmail: "Searching..."});
                        this.setState({courierName: "Searching..."});
                        this.setState({courierAddress: "Searching..."});
                    }
                }
                this.setState({holderEmail: holder.email});
                this.setState({holderName: holder.name});
                this.setState({holderAddress: holder.address});    
            }    
       }.bind(this));
    }
    render () {
        /*let holderEmail = this.props.order.chain[this.props.order.chain.length - 1].email;
        let holderName = this.props.order.chain[this.props.order.chain.length - 1].name;
        let holderAddress = this.props.order.chain[this.props.order.chain.length - 1].address;
        */
        return (
            <Animatable.View style={styles.card} animation="slideInUp" duration={500}>
                <Text style={[styles.subtitle, {alignSelf: "flex-start"}]}>{this.state.holderAddress}</Text>
                <Text style={[styles.subtitle, {fontSize: 16, alignSelf: "flex-start"}]}>Holder: {this.state.holderName}</Text>

                <View style={{flexDirection: "row", alignSelf: "flex-end", marginTop: 8, position: "absolute", bottom: 16}}>
                    <Text style={[styles.subtitle, {marginRight : 32, fontSize: 16, textAlign: "right"}]}>Pick up your order when convenient.</Text>
                </View>
            </Animatable.View>
        );
    }
}

export default class ProfileModal extends React.Component {
    state = {
        orders: [],
        pickups: [],
        name: "",
        address: "",
        points: 0
    }

    componentDidMount () {
        let email = firebase.auth().currentUser.email;
        if (email != undefined) {
            firebase.firestore().collection("users").doc(email).onSnapshot(function (doc) {
                if (doc.exists) {
                    let name = doc.data().name;
                    let address = doc.data().address;
                    this.setState({name: name});
                    this.setState({address: address});
                    this.setState({points: doc.data().points})
                }
            }.bind(this));

            firebase.firestore().collection("requests").onSnapshot(function(snapshot) {
                let orders = [];
                let pickups = [];
                snapshot.forEach(function (doc) {
                    if(doc.exists){
                        if ((doc.data().from == email || doc.data().chain.filter(obj => obj.email == email).length > 0) && (doc.data().chain.map(item => item.email).indexOf(email) >= doc.data().currentIndex || doc.data().chain.map(item => item.email).indexOf(email) < 0)){
                            pickups.push({...doc.data(), ...{id: doc.id}});
                        }
                    }
                });
                this.setState({orders: orders});
                this.setState({pickups: pickups})
            }.bind(this));

        }
    }

    renderPickupCard = (order) => {
        return (
            <IndivPickupCard order={order}/>
        );
    }

    renderOrderCard = (order) => {
        return (
            <IndivOrderCard order={order}/>
        );
    }
    
    render() {
        return (
            <View style={[styles.container, {backgroundColor: "rgba(247, 247, 247, 1)"}]}>
                <TouchableOpacity style={{position: "absolute", top: 16, right: 16}} onPress={() => this.props.closeModal()}>
                    <Ionicons name="md-close" size={32} color="#000000"/>
                </TouchableOpacity>

                <Text style={styles.greeting}>{this.state.name}</Text>
                <View style={{flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16}}>
                    <Text style={[styles.subtitle, {marginVertical: 8, paddingRight: 8, color: colors.primary}]}>{this.state.points}</Text>
                    <Ionicons name="md-medal" size={32} color={colors.primary} style={{justifyContent: "center", marginRight: 8}} size={24}/>
                </View>

                <View>
                    {/* <Text style={[styles.subtitle, {marginTop: 32}]}>Active Orders</Text>                        
                    <FlatList
                        data={this.state.orders}
                        style={{marginHorizontal: 32, maxHeight: 400}}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{paddingBottom: 48}}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => this.renderOrderCard(item)}
                    /> */}


                    <Text style={[styles.subtitle, {borderBottomWidth: 4, borderRadius: 10, paddingBottom: 16, borderColor: colors.primary, fontWeight: "700"}]}>Active Orders</Text>
                    <FlatList
                        data={this.state.pickups}
                        style={{marginHorizontal: 32, maxHeight: 400}}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{paddingBottom: 48}}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => this.renderPickupCard(item)}
                    />
                </View>

                <TouchableOpacity style={{alignItems: "center", marginBottom: 32}} onPress={() => this.props.signOut()}>
                    <Text style={{color: colors.primary}}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        );
    }

}