import Text "mo:core/Text";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  public type PostId = Nat;
  public type CommentId = Nat;
  public type CategoryId = Nat;
  public type IpHash = Text;

  public type Post = {
    id : PostId;
    title : Text;
    content : Text;
    category : ?CategoryId;
    timestamp : Int;
    upvotes : Nat;
    commentCount : Nat;
    ipHash : IpHash;
    isHidden : Bool;
  };

  public type Comment = {
    id : CommentId;
    postId : PostId;
    content : Text;
    timestamp : Int;
    upvotes : Nat;
    ipHash : IpHash;
    isHidden : Bool;
  };

  public type Category = {
    id : CategoryId;
    name : Text;
    isActive : Bool;
  };

  public type CreatePostError = {
    #bannedIp;
    #rateLimitExceeded;
    #contentBlocked;
    #internalError;
  };

  public type CreateCommentError = {
    #bannedIp;
    #contentBlocked;
    #internalError;
  };

  public type UpvoteResult = {
    newCount : Nat;
    alreadyVoted : Bool;
  };

  public type PostTab = {
    #trending;
    #latest;
  };

  public type PostWithComments = {
    post : Post;
    comments : [Comment];
  };

  public type PostsPage = {
    posts : [Post];
    totalCount : Nat;
  };

  public type Stats = {
    totalPosts : Nat;
    totalComments : Nat;
    dailyPostCounts : [Nat]; // Last 7 days
  };

  var nextPostId = 1;
  var nextCommentId = 1;
  var nextCategoryId = 1;

  let posts = Map.empty<PostId, Post>();
  let comments = Map.empty<CommentId, Comment>();
  let categories = Map.empty<CategoryId, Category>();
  let bannedIps = Set.empty<IpHash>();
  let blockedKeywords = Set.empty<Text>();

  let postUpvotes = Map.empty<PostId, Set.Set<IpHash>>();
  let commentUpvotes = Map.empty<CommentId, Set.Set<IpHash>>();
  let postTimestamps = Map.empty<IpHash, [Int]>();

  let initialCategories = [
    (#categoryId(1), "Career"),
    (#categoryId(2), "Workplace"),
    (#categoryId(3), "Startup"),
    (#categoryId(4), "Manufacturing"),
    (#categoryId(5), "Confessions"),
    (#categoryId(6), "Advice"),
  ];

  let dayInNanos : Int = 86_400_000_000_000;

  public shared ({ caller }) func createPost(title : Text, content : Text, category : ?CategoryId, ipHash : IpHash) : async {
    #ok : Post;
    #err : CreatePostError;
  } {
    if (not isValid(title) or not isValid(content)) { return #err(#internalError) };
    if (bannedIps.contains(ipHash)) { return #err(#bannedIp) };
    switch (category) {
      case (?categoryId) {
        switch (categories.get(categoryId)) {
          case (?cat) {
            if (not cat.isActive) { return #err(#internalError) };
          };
          case (null) { return #err(#internalError) };
        };
      };
      case (null) {};
    };

    let currentTimeNanos = Time.now();
    let lastHourNanos = currentTimeNanos - dayInNanos / 24;
    let recentPosts = postTimestamps.get(ipHash);
    switch (recentPosts) {
      case (?timestamps) {
        let countLastHour = timestamps.filter(func(t) { t > lastHourNanos }).size();
        if (countLastHour >= 5) { return #err(#rateLimitExceeded) };
        let newTimestamps = timestamps.filter(func(t) { t > lastHourNanos });
        postTimestamps.add(ipHash, [currentTimeNanos].concat(newTimestamps));
      };
      case (null) {
        postTimestamps.add(ipHash, [currentTimeNanos]);
      };
    };

    let post : Post = {
      id = nextPostId;
      title;
      content;
      category;
      timestamp = currentTimeNanos;
      upvotes = 0;
      commentCount = 0;
      ipHash;
      isHidden = false;
    };

    posts.add(nextPostId, post);
    nextPostId += 1;
    #ok(post);
  };

  public shared ({ caller }) func createComment(postId : PostId, content : Text, ipHash : IpHash) : async {
    #ok : Comment;
    #err : CreateCommentError;
  } {
    if (not isValid(content)) { return #err(#contentBlocked) };
    if (bannedIps.contains(ipHash)) { return #err(#bannedIp) };
    switch (posts.get(postId)) {
      case (null) { return #err(#internalError) };
      case (?post) {
        let comment : Comment = {
          id = nextCommentId;
          postId;
          content;
          timestamp = Time.now();
          upvotes = 0;
          ipHash;
          isHidden = false;
        };
        comments.add(nextCommentId, comment);
        nextCommentId += 1;

        let updatedPost = { post with commentCount = post.commentCount + 1 };
        posts.add(postId, updatedPost);
        #ok(comment);
      };
    };
  };

  public shared ({ caller }) func upvotePost(postId : PostId, ipHash : IpHash) : async ?UpvoteResult {
    switch (posts.get(postId)) {
      case (null) { null };
      case (?post) {
        let currentVoters = postUpvotes.get(postId);
        switch (currentVoters) {
          case (?voters) {
            if (voters.contains(ipHash)) {
              ?{ newCount = post.upvotes; alreadyVoted = true };
            } else {
              voters.add(ipHash);
              let updatedPost = { post with upvotes = post.upvotes + 1 };
              posts.add(postId, updatedPost);
              ?{ newCount = updatedPost.upvotes; alreadyVoted = false };
            };
          };
          case (null) {
            let newVoters = Set.empty<IpHash>();
            newVoters.add(ipHash);
            postUpvotes.add(postId, newVoters);
            let updatedPost = { post with upvotes = post.upvotes + 1 };
            posts.add(postId, updatedPost);
            ?{ newCount = updatedPost.upvotes; alreadyVoted = false };
          };
        };
      };
    };
  };

  public shared ({ caller }) func upvoteComment(commentId : CommentId, ipHash : IpHash) : async ?UpvoteResult {
    switch (comments.get(commentId)) {
      case (null) { null };
      case (?comment) {
        let currentVoters = commentUpvotes.get(commentId);
        switch (currentVoters) {
          case (?voters) {
            if (voters.contains(ipHash)) {
              ?{ newCount = comment.upvotes; alreadyVoted = true };
            } else {
              voters.add(ipHash);
              let updatedComment = { comment with upvotes = comment.upvotes + 1 };
              comments.add(commentId, updatedComment);
              ?{ newCount = updatedComment.upvotes; alreadyVoted = false };
            };
          };
          case (null) {
            let newVoters = Set.empty<IpHash>();
            newVoters.add(ipHash);
            commentUpvotes.add(commentId, newVoters);
            let updatedComment = { comment with upvotes = comment.upvotes + 1 };
            comments.add(commentId, updatedComment);
            ?{ newCount = updatedComment.upvotes; alreadyVoted = false };
          };
        };
      };
    };
  };

  public query ({ caller }) func getPosts(tab : PostTab, category : ?CategoryId, page : Nat, pageSize : Nat) : async PostsPage {
    let allPosts = posts.values();
    let filtered = allPosts.filter(
      func(p) {
        switch (category, p.category) {
          case (null, _) { true };
          case (?catId, ?postCatId) { catId == postCatId };
          case (_, _) { false };
        };
      }
    );
    let filteredArray = filtered.toArray();
    let sorted = filteredArray.reverse(); // osrt by latest

    let startIdx = page * pageSize;
    let endIdx = startIdx + pageSize;
    let totalCount = sorted.size();
    if (startIdx >= totalCount) {
      return {
        posts = [];
        totalCount;
      };
    };
    {
      posts = sorted.sliceToArray(startIdx, Int.min(endIdx.toInt(), totalCount.toInt()).toNat());
      totalCount = filtered.size();
    };
  };

  public query ({ caller }) func getPost(id : PostId) : async PostWithComments {
    switch (posts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let postComments = comments.values().filter(func(c) { c.postId == id });
        { post; comments = postComments.toArray() };
      };
    };
  };

  public query ({ caller }) func getComments(postId : PostId) : async [Comment] {
    let filteredComments = comments.values().filter(func(c) { c.postId == postId and not c.isHidden });
    filteredComments.toArray();
  };

  public query ({ caller }) func getAnonymousId(ipHash : IpHash, postId : PostId) : async Nat {
    let hashValue = ipHash.size() + postId;
    let anonId = (hashValue % 9000) + 1000;
    anonId;
  };

  public query ({ caller }) func getStats() : async Stats {
    let totalPosts = posts.size();
    let totalComments = comments.size();
    let dailyPostCounts : [Nat] = [0, 0, 0, 0, 0, 0, 0];
    {
      totalPosts;
      totalComments;
      dailyPostCounts;
    };
  };

  public shared ({ caller }) func adminDeletePost(id : PostId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    posts.remove(id);
    true;
  };

  public shared ({ caller }) func adminDeleteComment(id : CommentId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    comments.remove(id);
    true;
  };

  public shared ({ caller }) func adminBanIp(ipHash : IpHash, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    bannedIps.add(ipHash);
    true;
  };

  public shared ({ caller }) func adminUnbanIp(ipHash : IpHash, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    bannedIps.remove(ipHash);
    true;
  };

  public shared ({ caller }) func adminAddBlockedKeyword(keyword : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    blockedKeywords.add(keyword);
    true;
  };

  public shared ({ caller }) func adminRemoveBlockedKeyword(keyword : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    blockedKeywords.remove(keyword);
    true;
  };

  public shared ({ caller }) func adminAddCategory(name : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    let category : Category = {
      id = nextCategoryId;
      name;
      isActive = true;
    };
    categories.add(nextCategoryId, category);
    nextCategoryId += 1;
    true;
  };

  public shared ({ caller }) func adminRemoveCategory(id : CategoryId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    categories.remove(id);
    true;
  };

  public query ({ caller }) func adminGetBannedIps(adminPassword : Text) : async ?[IpHash] {
    if (adminPassword != "whisper2024") { return null };
    ?bannedIps.toArray();
  };

  public query ({ caller }) func adminGetBlockedKeywords(adminPassword : Text) : async ?[Text] {
    if (adminPassword != "whisper2024") { return null };
    ?blockedKeywords.toArray();
  };

  public query ({ caller }) func adminGetCategories(adminPassword : Text) : async ?[Category] {
    if (adminPassword != "whisper2024") { return null };
    ?categories.values().toArray();
  };

  public query ({ caller }) func getCategories() : async [Category] {
    let activeCategories = categories.values().filter(func(c) { c.isActive });
    activeCategories.toArray();
  };

  func isValid(text : Text) : Bool {
    let trimmed = text.trim(#char(' '));
    trimmed.size() > 0;
  };
};
