echo "deploying to $1@$2:$3"
npm run build
echo "compiled!"
echo "attempting to clear out old files"
ssh $1@$2 -q "rm -rf $3/public"
echo "cleared old files!"
echo "deploying..."
scp -r ./public $1@$2:$3