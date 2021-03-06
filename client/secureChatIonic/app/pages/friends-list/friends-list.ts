import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController } from 'ionic-angular';

//Import our providers
import { AppSettings } from '../../providers/app-settings/app-settings';
import { AppNotify } from '../../providers/app-notify/app-notify';
import { AppUsers} from '../../providers/app-users/app-users';

//Import pages
import { SearchFriendsPage } from '../../pages/search-friends/search-friends';
import { ViewUserPage } from '../../pages/view-user/view-user';

/*
  Generated class for the FriendsListPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/friends-list/friends-list.html',
})
export class FriendsListPage {

  friends: any;

  pendingFriends: any;

  constructor(private changeDetector: ChangeDetectorRef, private navCtrl: NavController, private appNotify: AppNotify, private appUsers: AppUsers) {

    //Initialize friends
    this.friends = [];
    this.pendingFriends = [];
  }

  //Call function every time the view loads
  ionViewDidEnter() {

    //Grab our user from localstorage
    let user = JSON.parse(localStorage.getItem(AppSettings.shushItemName))

    //Start Loading
    this.appNotify.startLoading('Getting Friends...');

    //Start polling to get messages
    let request = this.appUsers.getUserFriends();

    //Get a reference to this
    let self = this;

    //Get our current conversation
    request.subscribe(function(success) {
      //Success!
      //Stop loading
      self.appNotify.stopLoading().then(function() {

        //Save our friends
        self.friends = success.friends;

        //Save our pending friends
        self.pendingFriends = success.pendingFriends;

        //Update the UI
        self.changeDetector.detectChanges();
      });
    }, function(error) {
      //Error!
      //Stop Loading
      self.appNotify.stopLoading().then(function() {
        self.appNotify.handleError(error, [
          {
            status: '404',
            callback: function() {
              //Do nothing, because they simply don't have friends yet
            }
          }
        ]);
      });

    }, function() {
      //Completed
    })
  }

  //Function to navigate to the search friends page
  goToSearchFriends() {
    this.navCtrl.push(SearchFriendsPage);
  }

  //Go to a users page
  goToUser(user) {
    //Go to the conversation page, and pass the conversation id
    this.navCtrl.push(ViewUserPage, {
      user: user
    });
  }

}
