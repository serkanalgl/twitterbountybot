/**
 * Created by serkanalgul on 16.03.2018.
 */

/**
 *
 * get retweeted tweets of logged in user
 * iterate users which is defined in config.js
 * check the logged in user is retweeted today
 *   if no,
 *      get latest unretweeted tweet of the iterated user
 *      retweet
 *
 **/


var _ = require("underscore");
var moment = require("moment");

var twit = require("twit");
var config = require("./config.js");

var Twitter = new twit(config);

var getRetweetsOfLoggedInUser = function(callback) {

    console.log('getting retweets of logged in user');

    Twitter.get('statuses/user_timeline',{ screen_name: config.my_twitter_account, count: 100 }, function(err, data, response) {

        if(err){
            callback(err, null);
        }else{
            callback(false, _.where(data, { retweeted : true }) );
        }

    });
};

var getLatestTweet = function(name, callback) {

    console.log('getting latest tweet of @' + name);

    Twitter.get('statuses/user_timeline', { screen_name: name, count: 10 }, function(err, data, response) {

        if(err){
            callback(err, null);
        }else{
            //unretweeted latest tweet
            var tweet = _.find(data, function(item) { return !item.retweeted; });
            if(tweet){
                callback(null, tweet);
            }else{
                callback(new Error('no tweet found for @' + name), null);
            }
        }

    });
};

var checkDate = function(createdAtStr){

    var today = moment(new Date());
    var createdAtDate = moment(createdAtStr, 'ddd MMM DD HH:mm:ss Z YYYY');

    return today.isSame(createdAtDate, 'day') && today.isSame(createdAtDate, 'month') && today.isSame(createdAtDate, 'year');

};

var retweet = function(retweetId) {

    console.log('retweeting ' + retweetId);

    Twitter.post('statuses/retweet/:id', {
        id: retweetId
    }, function(err, response) {
        if (response) {
            console.log('retweeted successfully');
        }
        // if there was an error while tweeting
        if (err) {
            console.log('something went wrong while retweeting... duplication maybe...');
        }
    });

};


var boot = function(){

    if(config.twitter_accounts.length === 0){
        console.error('no twitter account found. add an account in config.js file.');
        return;
    }

    getRetweetsOfLoggedInUser(function(err, retweets){

        _.each(config.twitter_accounts, function(account){

            var found = _.find(retweets, function(item){
                return item.retweeted_status.user.screen_name === account && checkDate(item.created_at);
            });

            if( found ){
                console.warn('already retweeted today for @' + account);
            }else{

                getLatestTweet(account, function(err, data){

                    if(!err){
                        retweet(data.id_str);
                    }else{
                        console.log(err);
                    }

                });

            }

        });

    });

};

boot();